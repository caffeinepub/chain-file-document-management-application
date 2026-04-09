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

const ICP_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const getCanisterPrincipal = (): string =>
  import.meta.env.VITE_BACKEND_CANISTER_ID || "rrkah-fqaaa-aaaaa-aaaaq-cai";

declare global {
  interface Window {
    ic?: {
      plug?: {
        requestConnect: (o: {
          whitelist: string[];
          host?: string;
        }) => Promise<boolean>;
        isConnected: () => Promise<boolean>;
        disconnect: () => Promise<void>;
        getPrincipal: () => Promise<Principal>;
        requestTransfer: (p: {
          to: string;
          amount: number;
          memo?: bigint;
        }) => Promise<{ height: bigint }>;
        createAgent: (o?: {
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
      transfer: (p: { to: string; amount: number; memo?: bigint }) => Promise<{
        height: bigint;
      }>;
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
    if (icpPrice && requiredStorageBytes > 0n) calculatePaymentAmount();
  }, [icpPrice, requiredStorageBytes]);

  const fetchICPPrice = async () => {
    setIsFetchingPrice(true);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd",
      );
      const data = await res.json();
      const price = data["internet-computer"]?.usd;
      setIcpPrice(price || 10);
      if (!price)
        toast.info("Using estimated ICP price. Actual price may vary.");
    } catch {
      setIcpPrice(10);
      toast.info("Using estimated ICP price. Actual price may vary.");
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const calculatePaymentAmount = () => {
    if (!icpPrice) return;
    const FREE = 1_073_741_824;
    const overageBytes = Number(requiredStorageBytes) - FREE;
    if (overageBytes <= 0) {
      setPaymentAmount(0);
      return;
    }
    const overageGB = overageBytes / FREE;
    const usdAmount = Math.ceil(overageGB) * 2;
    setPaymentAmount(Math.ceil((usdAmount / icpPrice) * 1.1 * 10000) / 10000);
  };

  const checkExistingConnection = async () => {
    try {
      if (window.ic?.plug) {
        const connected = await window.ic.plug.isConnected();
        if (connected) {
          const p = await window.ic.plug.getPrincipal();
          setConnectedWallet({ type: "plug", principal: p.toString() });
          return;
        }
      }
      if (window.stoic?.isConnected()) {
        const p = window.stoic.getPrincipal();
        setConnectedWallet({ type: "stoic", principal: p.toString() });
      }
    } catch (error) {
      console.error("Connection check error:", error);
    }
  };

  const connectPlugWallet = async () => {
    setIsConnecting(true);
    try {
      if (!window.ic?.plug) {
        toast.error(
          "Plug wallet not detected. Please install the Plug extension.",
        );
        window.open("https://plugwallet.ooo/", "_blank");
        return;
      }
      const whitelist = [ICP_LEDGER_CANISTER_ID, getCanisterPrincipal()];
      const ok = await window.ic.plug.requestConnect({
        whitelist,
        host: window.location.origin,
      });
      if (ok) {
        await window.ic.plug.createAgent({ whitelist });
        const p = await window.ic.plug.getPrincipal();
        setConnectedWallet({ type: "plug", principal: p.toString() });
        toast.success("Plug wallet connected!");
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to connect Plug wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const connectStoicWallet = async () => {
    setIsConnecting(true);
    try {
      if (!window.stoic) {
        toast.error("Stoic wallet not detected.");
        window.open("https://www.stoicwallet.com/", "_blank");
        return;
      }
      const result = await window.stoic.connect();
      setConnectedWallet({
        type: "stoic",
        principal: result.principal.toString(),
        accountId: result.accountId,
      });
      toast.success("Stoic wallet connected!");
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to connect Stoic wallet");
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
      if (connectedWallet?.type === "plug" && window.ic?.plug)
        await window.ic.plug.disconnect();
      else if (connectedWallet?.type === "stoic" && window.stoic)
        window.stoic.disconnect();
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
      const amountE8s = Math.floor(paymentAmount * 100_000_000);
      const memo = BigInt(Date.now());
      let result: { height?: bigint | number } | undefined;
      if (connectedWallet.type === "plug" && window.ic?.plug) {
        result = await window.ic.plug.requestTransfer({
          to: getCanisterPrincipal(),
          amount: amountE8s,
          memo,
        });
      } else if (connectedWallet.type === "stoic" && window.stoic) {
        result = await window.stoic.transfer({
          to: getCanisterPrincipal(),
          amount: amountE8s,
          memo,
        });
      } else {
        throw new Error("Wallet not properly connected");
      }
      if (result?.height) {
        const transactionId = `${result.height.toString()}-${Date.now()}`;
        await confirmPayment.mutateAsync({
          transactionId,
          amount: BigInt(amountE8s),
        });
        toast.success("Payment successful! Storage limit increased.");
        onPaymentConfirmed();
        onOpenChange(false);
      }
    } catch (error: unknown) {
      const err = error as Error;
      if (
        err.message?.includes("InsufficientFunds") ||
        err.message?.includes("insufficient")
      )
        toast.error("Insufficient ICP balance in your wallet");
      else if (
        err.message?.includes("rejected") ||
        err.message?.includes("User rejected")
      )
        toast.error("Transaction rejected by user");
      else if (err.message?.includes("already used"))
        toast.error("This transaction has already been processed");
      else toast.error(err.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const overageGB = (() => {
    const FREE = 1_073_741_824;
    const o = Number(requiredStorageBytes) - FREE;
    return Math.ceil(o / FREE);
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg bg-card border-border shadow-deep"
        data-ocid="payment-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 font-display font-semibold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10 border border-yellow-500/25">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </div>
            Storage Limit Reached
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            You've reached your free 1 GB limit. Connect your ICP wallet to
            purchase additional storage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!connectedWallet ? (
            <>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Select Your ICP Wallet
                </p>
                <div className="grid gap-2">
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
              <Card className="border-border bg-muted/30">
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground">
                        Payment Information
                      </p>
                      {isFetchingPrice ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
                          Calculating payment amount…
                        </div>
                      ) : (
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          <li>• Storage overage: {overageGB} GB</li>
                          <li>• Rate: $2 per GB</li>
                          <li>
                            • Payment amount: ~{paymentAmount.toFixed(4)} ICP
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
              <Card className="border-accent/25 bg-accent/5">
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-start gap-3">
                    <img
                      src="/assets/generated/wallet-connected-icon-transparent.dim_64x64.png"
                      alt="Connected"
                      className="h-9 w-9"
                    />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">
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
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Disconnect
                        </Button>
                      </div>
                      <div className="rounded-md border border-border bg-background/50 p-2">
                        <p className="text-[10px] text-muted-foreground mb-0.5">
                          Principal ID
                        </p>
                        <p className="font-mono text-xs text-foreground break-all">
                          {connectedWallet.principal}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-muted/30">
                <CardContent className="pt-4 pb-4 px-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Storage Overage
                    </span>
                    <span className="font-semibold text-foreground">
                      {overageGB} GB
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-semibold text-foreground">
                      $2 per GB
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Payment Amount
                    </span>
                    {isFetchingPrice ? (
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    ) : (
                      <span className="text-xl font-display font-bold text-accent">
                        {paymentAmount.toFixed(4)} ICP
                      </span>
                    )}
                  </div>
                  {icpPrice && (
                    <p className="text-xs text-muted-foreground">
                      ≈ ${(paymentAmount * icpPrice).toFixed(2)} USD at current
                      rate
                    </p>
                  )}
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
            className="border-border bg-card hover:bg-muted font-medium"
          >
            Cancel
          </Button>
          {connectedWallet && (
            <Button
              onClick={processPayment}
              disabled={
                isProcessingPayment || isFetchingPrice || paymentAmount <= 0
              }
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-elevated"
              data-ocid="confirm-payment-btn"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing
                  Payment…
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" /> Pay {paymentAmount.toFixed(4)}{" "}
                  ICP
                </>
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
      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted hover:border-accent/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      data-ocid={`wallet-btn-${name.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <img src={icon} alt={name} className="h-8 w-8 flex-shrink-0" />
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-medium text-foreground">{name}</p>
        {comingSoon && (
          <p className="text-xs text-muted-foreground">Coming Soon</p>
        )}
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
    </button>
  );
}
