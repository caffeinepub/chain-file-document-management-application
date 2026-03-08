import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Principal } from "@dfinity/principal";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useConfirmPayment } from "../hooks/useQueries";

interface CryptoPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentConfirmed: () => void;
  requiredStorageBytes?: bigint;
}

type WalletType = "plug" | "stoic" | "identity" | null;

interface ConnectedWallet {
  type: WalletType;
  principal: string;
  accountId?: string;
}

// ICP Ledger Canister ID on mainnet
const ICP_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";

// Get current canister ID from environment
const getCanisterPrincipal = (): string => {
  // In production, this would be your backend canister ID
  // For now, we'll use a placeholder that should be replaced with actual canister ID
  return (
    import.meta.env.VITE_BACKEND_CANISTER_ID || "rrkah-fqaaa-aaaaa-aaaaq-cai"
  );
};

declare global {
  interface Window {
    ic?: {
      plug?: {
        requestConnect: (options: {
          whitelist: string[];
          host?: string;
        }) => Promise<boolean>;
        isConnected: () => Promise<boolean>;
        disconnect: () => Promise<void>;
        getPrincipal: () => Promise<Principal>;
        requestTransfer: (params: {
          to: string;
          amount: number;
          memo?: bigint;
        }) => Promise<{ height: bigint }>;
        createAgent: (options?: {
          whitelist: string[];
          host?: string;
        }) => Promise<void>;
      };
    };
    stoic?: {
      connect: () => Promise<{ principal: Principal; accountId: string }>;
      disconnect: () => void;
      isConnected: () => boolean;
      getPrincipal: () => Principal;
      transfer: (params: {
        to: string;
        amount: number;
        memo?: bigint;
      }) => Promise<{ height: bigint }>;
    };
  }
}

export default function CryptoPaymentModal({
  open,
  onOpenChange,
  onPaymentConfirmed,
  requiredStorageBytes = 0n,
}: CryptoPaymentModalProps) {
  const [connectedWallet, setConnectedWallet] =
    useState<ConnectedWallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [icpPrice, setIcpPrice] = useState<number | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const confirmPayment = useConfirmPayment();

  useEffect(() => {
    if (open) {
      checkExistingConnection();
      fetchICPPrice();
    }
  }, [open]);

  useEffect(() => {
    if (icpPrice && requiredStorageBytes > 0n) {
      calculatePaymentAmount();
    }
  }, [icpPrice, requiredStorageBytes]);

  const fetchICPPrice = async () => {
    setIsFetchingPrice(true);
    try {
      // Fetch ICP price from CoinGecko API
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd",
      );
      const data = await response.json();
      const price = data["internet-computer"]?.usd;

      if (price) {
        setIcpPrice(price);
      } else {
        // Fallback price if API fails
        setIcpPrice(10); // Approximate ICP price
        toast.info("Using estimated ICP price. Actual price may vary.");
      }
    } catch (error) {
      console.error("Error fetching ICP price:", error);
      // Fallback price
      setIcpPrice(10);
      toast.info("Using estimated ICP price. Actual price may vary.");
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const calculatePaymentAmount = () => {
    if (!icpPrice) return;

    const FREE_LIMIT_BYTES = 1_073_741_824; // 1 GB
    const overageBytes = Number(requiredStorageBytes) - FREE_LIMIT_BYTES;

    if (overageBytes <= 0) {
      setPaymentAmount(0);
      return;
    }

    // Calculate overage in GB
    const overageGB = overageBytes / FREE_LIMIT_BYTES;

    // $2 per GB
    const usdAmount = Math.ceil(overageGB) * 2;

    // Convert USD to ICP (add 10% buffer for price fluctuations)
    const icpAmount = (usdAmount / icpPrice) * 1.1;

    // Round to 4 decimal places
    setPaymentAmount(Math.ceil(icpAmount * 10000) / 10000);
  };

  const checkExistingConnection = async () => {
    try {
      // Check Plug
      if (window.ic?.plug) {
        const isConnected = await window.ic.plug.isConnected();
        if (isConnected) {
          const principal = await window.ic.plug.getPrincipal();
          setConnectedWallet({
            type: "plug",
            principal: principal.toString(),
          });
          return;
        }
      }

      // Check Stoic
      if (window.stoic?.isConnected()) {
        const principal = window.stoic.getPrincipal();
        setConnectedWallet({
          type: "stoic",
          principal: principal.toString(),
        });
        return;
      }
    } catch (error) {
      console.error("Error checking existing connection:", error);
    }
  };

  const connectPlugWallet = async () => {
    setIsConnecting(true);
    try {
      if (!window.ic?.plug) {
        toast.error(
          "Plug wallet not detected. Please install Plug wallet extension.",
        );
        window.open("https://plugwallet.ooo/", "_blank");
        return;
      }

      const whitelist = [ICP_LEDGER_CANISTER_ID, getCanisterPrincipal()];
      const isConnected = await window.ic.plug.requestConnect({
        whitelist,
        host: window.location.origin,
      });

      if (isConnected) {
        await window.ic.plug.createAgent({ whitelist });
        const principal = await window.ic.plug.getPrincipal();
        setConnectedWallet({
          type: "plug",
          principal: principal.toString(),
        });
        toast.success("Plug wallet connected successfully!");
      }
    } catch (error: any) {
      console.error("Plug connection error:", error);
      toast.error(error.message || "Failed to connect Plug wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const connectStoicWallet = async () => {
    setIsConnecting(true);
    try {
      if (!window.stoic) {
        toast.error("Stoic wallet not detected. Please install Stoic wallet.");
        window.open("https://www.stoicwallet.com/", "_blank");
        return;
      }

      const result = await window.stoic.connect();
      setConnectedWallet({
        type: "stoic",
        principal: result.principal.toString(),
        accountId: result.accountId,
      });
      toast.success("Stoic wallet connected successfully!");
    } catch (error: any) {
      console.error("Stoic connection error:", error);
      toast.error(error.message || "Failed to connect Stoic wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const connectIdentityWallet = async () => {
    toast.info(
      "Internet Identity integration coming soon. Please use Plug or Stoic wallet.",
    );
  };

  const disconnectWallet = async () => {
    try {
      if (connectedWallet?.type === "plug" && window.ic?.plug) {
        await window.ic.plug.disconnect();
      } else if (connectedWallet?.type === "stoic" && window.stoic) {
        window.stoic.disconnect();
      }
      setConnectedWallet(null);
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  const processPayment = async () => {
    if (!connectedWallet) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (paymentAmount <= 0) {
      toast.error("Invalid payment amount");
      return;
    }

    setIsProcessingPayment(true);
    try {
      const canisterPrincipal = getCanisterPrincipal();

      // Convert ICP to e8s (1 ICP = 100,000,000 e8s)
      const amountE8s = Math.floor(paymentAmount * 100_000_000);

      let transactionResult: { height?: bigint | number } | undefined;
      const memo = BigInt(Date.now());

      if (connectedWallet.type === "plug" && window.ic?.plug) {
        // Transfer using Plug
        transactionResult = await window.ic.plug.requestTransfer({
          to: canisterPrincipal,
          amount: amountE8s,
          memo,
        });
      } else if (connectedWallet.type === "stoic" && window.stoic) {
        // Transfer using Stoic
        transactionResult = await window.stoic.transfer({
          to: canisterPrincipal,
          amount: amountE8s,
          memo,
        });
      } else {
        throw new Error("Wallet not properly connected");
      }

      if (transactionResult?.height) {
        // Generate transaction ID from block height and timestamp
        const transactionId = `${transactionResult.height.toString()}-${Date.now()}`;

        // Confirm payment on backend with transaction details
        await confirmPayment.mutateAsync({
          transactionId,
          amount: BigInt(amountE8s),
        });

        toast.success("Payment successful! Storage limit increased.");
        onPaymentConfirmed();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      if (
        error.message?.includes("InsufficientFunds") ||
        error.message?.includes("insufficient")
      ) {
        toast.error("Insufficient ICP balance in your wallet");
      } else if (
        error.message?.includes("rejected") ||
        error.message?.includes("User rejected")
      ) {
        toast.error("Transaction rejected by user");
      } else if (error.message?.includes("already used")) {
        toast.error("This transaction has already been processed");
      } else {
        toast.error(error.message || "Payment failed. Please try again.");
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const formatICP = (amount: number) => {
    return amount.toFixed(4);
  };

  const getStorageOverageGB = () => {
    const FREE_LIMIT_BYTES = 1_073_741_824;
    const overageBytes = Number(requiredStorageBytes) - FREE_LIMIT_BYTES;
    return Math.ceil(overageBytes / FREE_LIMIT_BYTES);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <AlertCircle className="h-6 w-6 text-warning" />
            Storage Limit Reached
          </DialogTitle>
          <DialogDescription className="text-base">
            You've reached your free 1 GB storage limit. Connect your ICP wallet
            to purchase additional storage and continue using Chain File.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!connectedWallet ? (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Select Your ICP Wallet</h3>
                <div className="grid gap-3">
                  <WalletButton
                    name="Plug Wallet"
                    icon="/assets/generated/plug-wallet-icon-transparent.dim_64x64.png"
                    onClick={connectPlugWallet}
                    disabled={isConnecting}
                  />
                  <WalletButton
                    name="Stoic Wallet"
                    icon="/assets/generated/stoic-wallet-icon-transparent.dim_64x64.png"
                    onClick={connectStoicWallet}
                    disabled={isConnecting}
                  />
                  <WalletButton
                    name="Internet Identity"
                    icon="/assets/generated/identity-wallet-icon-transparent.dim_64x64.png"
                    onClick={connectIdentityWallet}
                    disabled={isConnecting}
                    comingSoon
                  />
                </div>
              </div>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Payment Information</p>
                      {isFetchingPrice ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Calculating payment amount...</span>
                        </div>
                      ) : (
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Storage overage: {getStorageOverageGB()} GB</li>
                          <li>• Rate: $2 per GB</li>
                          <li>
                            • Payment amount: ~{formatICP(paymentAmount)} ICP
                          </li>
                          <li>• Secure on-chain transaction</li>
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <img
                      src="/assets/generated/wallet-connected-icon-transparent.dim_64x64.png"
                      alt="Connected"
                      className="h-10 w-10"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {connectedWallet.type === "plug"
                            ? "Plug Wallet"
                            : connectedWallet.type === "stoic"
                              ? "Stoic Wallet"
                              : "Internet Identity"}{" "}
                          Connected
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={disconnectWallet}
                          disabled={isProcessingPayment}
                        >
                          Disconnect
                        </Button>
                      </div>
                      <div className="rounded-md bg-background p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          Principal ID
                        </p>
                        <p className="font-mono text-xs break-all">
                          {connectedWallet.principal}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Storage Overage
                      </span>
                      <span className="text-lg font-bold">
                        {getStorageOverageGB()} GB
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Rate</span>
                      <span className="text-lg font-bold">$2 per GB</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Payment Amount
                        </span>
                        {isFetchingPrice ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span className="text-2xl font-bold text-primary">
                            {formatICP(paymentAmount)} ICP
                          </span>
                        )}
                      </div>
                      {icpPrice && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ≈ ${(paymentAmount * icpPrice).toFixed(2)} USD (at
                          current rate)
                        </p>
                      )}
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        This payment will increase your storage limit to
                        accommodate your files. The transaction will be
                        processed on the Internet Computer blockchain.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConnecting || isProcessingPayment}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          {connectedWallet && (
            <Button
              onClick={processPayment}
              disabled={
                isProcessingPayment || isFetchingPrice || paymentAmount <= 0
              }
              className="w-full sm:w-auto"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                `Pay ${formatICP(paymentAmount)} ICP`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface WalletButtonProps {
  name: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
}

function WalletButton({
  name,
  icon,
  onClick,
  disabled,
  comingSoon,
}: WalletButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || comingSoon}
      className="flex items-center gap-4 p-4 rounded-lg border-2 border-muted hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <img src={icon} alt={name} className="h-10 w-10" />
      <div className="flex-1 text-left">
        <p className="font-medium">{name}</p>
        {comingSoon && (
          <p className="text-xs text-muted-foreground">Coming Soon</p>
        )}
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
