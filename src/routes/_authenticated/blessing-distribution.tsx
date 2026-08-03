import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getIndividualsBySaintFamily,
  getBlessingDistribution,
  scanBlessingDistribution,
  toggleBlessingDistribution,
  getInventory,
} from "@/lib/church.functions";
import { useAuth, type Role } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Check, ScanBarcode, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/blessing-distribution")({
  head: () => ({ meta: [{ title: "توزيع البركة" }] }),
  component: BlessingDistribution,
});

const SAINT_FAMILIES = [
  { value: "متى", label: "القديس متى" },
  { value: "مرقس", label: "القديس مرقس" },
  { value: "لوقا", label: "القديس لوقا" },
  { value: "يوحنا", label: "القديس يوحنا" },
  { value: "أسر مستترة", label: "الأسر المستترة" },
];

const FILTERED_SAINT_FAMILIES = (role: Role | null) => {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return SAINT_FAMILIES;
  if (role === "ST_HIDDEN_FAMILIES") return SAINT_FAMILIES.filter((f) => f.value === "أسر مستترة");
  if (["ST_MATTHEW", "ST_MARK", "ST_JOHN", "ST_LUKE"].includes(role as any)) {
    const roleToFamily: Record<string, string> = {
      ST_MATTHEW: "متى",
      ST_MARK: "مرقس",
      ST_JOHN: "يوحنا",
      ST_LUKE: "لوقا",
    };
    const myFamily = roleToFamily[role as string];
    return SAINT_FAMILIES.filter((f) => f.value === myFamily);
  }
  return SAINT_FAMILIES.filter((f) => f.value !== "أسر مستترة");
};

const SCANNER_MAX_KEY_INTERVAL_MS = 80;

type Individual = {
  id: string;
  full_name: string;
  nickname: string | null;
  national_id: string | null;
};

type BlessingRecord = {
  id: string;
  saint_family: string;
  individual_id: string;
  received: boolean;
  distribution_date: string;
};

const BLESSING_BLOCKED_ROLES = ["BRIDE_AND_MEDICAL_AIDS_MANAGER", "SUPPLY_WAREHOUSE_MANAGER"];

function BlessingDistribution() {
  const { role, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (BLESSING_BLOCKED_ROLES.includes(role as any)) {
      toast.error("غير مصرح لك بهذا الحقل");
      router.navigate({ to: "/" });
    }
  }, [role]);

  const [selectedFamily, setSelectedFamily] = useState<string>("");

  // Scanner state
  const [lastScannedName, setLastScannedName] = useState<string | null>(null);
  const [scannerProcessing, setScannerProcessing] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

  const queryClient = useQueryClient();
  const fetchIndividuals = useServerFn(getIndividualsBySaintFamily);
  const fetchBlessingDistribution = useServerFn(getBlessingDistribution);
  const scanDistribution = useServerFn(scanBlessingDistribution);
  const toggleDistribution = useServerFn(toggleBlessingDistribution);
  const fetchInventory = useServerFn(getInventory);

  const { data: inventory } = useQuery<{ weekly_total: number } | null>({
    queryKey: ["blessing-batch"],
    queryFn: () => fetchInventory(),
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 10_000,
  });

  const today = new Date().toISOString().split("T")[0];

  // Individuals + blessing records fetched via React Query so invalidation
  // immediately refreshes checkboxes and the top counters in real-time.
  const { data: individuals = [], isLoading: isLoadingIndividuals } = useQuery<Individual[]>({
    queryKey: ["blessing-individuals", selectedFamily],
    queryFn: () => fetchIndividuals({ data: { saint_family: selectedFamily as any } }),
    enabled: !!selectedFamily,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: blessingRecords = [], isLoading: isLoadingRecords } = useQuery<BlessingRecord[]>({
    queryKey: ["blessing-records", selectedFamily, today],
    queryFn: () =>
      fetchBlessingDistribution({
        data: { saint_family: selectedFamily as any, distribution_date: today },
      }),
    enabled: !!selectedFamily,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const isLoading = isLoadingIndividuals || isLoadingRecords;

  // --- Scanner buffer refs (kept stable) ---
  const scannerBufferRef = useRef("");
  const scannerLastKeyTimeRef = useRef(0);

  // ---- Central refresh: invalidate everything that renders state ----
  const refreshAll = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["blessing-individuals", selectedFamily] });
    await queryClient.invalidateQueries({ queryKey: ["blessing-records", selectedFamily, today] });
    await queryClient.invalidateQueries({ queryKey: ["blessing-batch"] });
  }, [queryClient, selectedFamily, today]);

  // ---- Manual checkbox toggle mutation ----
  const toggleMutation = useMutation({
    mutationFn: (vars: { saint_family: string; individual_id: string }) =>
      toggleDistribution({ data: vars }),
    onSuccess: async (result, vars) => {
      toast.success(
        result.received
          ? `تم تسجيل البركة لـ ${result.individual_name}`
          : `تم إلغاء تسجيل البركة لـ ${result.individual_name}`,
      );
      await refreshAll();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "خطأ في تحديث الحالة");
    },
  });

  // ---- Execute a single barcode scan ----
  const executeScan = useCallback(
    async (nationalId: string) => {
      setScannerProcessing(true);
      setLastScannedName(null);
      try {
        const result = await scanDistribution({ data: { national_id: nationalId } });
        setLastScannedName(result.individual_name);
        toast.success(`تم تسجيل البركة لـ ${result.individual_name}`);
        await refreshAll();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "خطأ في المسح";
        toast.error(msg);
        // Even on error (e.g. "already received"), re-sync so the checkbox and
        // counters reflect the latest server state.
        await refreshAll();
      } finally {
        setScannerProcessing(false);
      }
    },
    [scanDistribution, refreshAll],
  );

  // ---- Admin manual barcode input (type national ID to scan) ----
  async function handleManualScan(e: React.FormEvent) {
    e.preventDefault();
    const id = manualInput.trim();
    if (!id) return;
    setManualLoading(true);
    try {
      const result = await scanDistribution({ data: { national_id: id } });
      toast.success(`تم تسجيل البركة لـ ${result.individual_name}`);
      setManualInput("");
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطأ في البحث");
      await refreshAll();
    } finally {
      setManualLoading(false);
    }
  }

  // ---- Global keydown listener for hardware barcode scanner ----
  useEffect(() => {
    function isTextInputFocused() {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (el as HTMLElement).isContentEditable
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isTextInputFocused()) return;
      if (document.querySelector("[role='dialog']")) return;

      const now = Date.now();
      const timeSinceLast = now - scannerLastKeyTimeRef.current;

      if (timeSinceLast > SCANNER_MAX_KEY_INTERVAL_MS && scannerBufferRef.current.length > 0) {
        scannerBufferRef.current = "";
      }

      scannerLastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const buf = scannerBufferRef.current.trim();
        scannerBufferRef.current = "";
        if (buf.length > 0) {
          e.preventDefault();
          executeScan(buf);
        }
        return;
      }

      if (e.key.length > 1 && e.key !== "Backspace" && e.key !== "Delete") return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key.length === 1) {
        scannerBufferRef.current += e.key;
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [executeScan]);

  const receivedSet = new Set(
    blessingRecords.filter((r) => r.received).map((r) => r.individual_id),
  );
  const receivedCount = receivedSet.size;
  const notReceivedCount = individuals.length - receivedCount;

  const canToggle = isAdmin;

  if (BLESSING_BLOCKED_ROLES.includes(role as any)) {
    return <div className="text-center py-8 text-muted-foreground">جاري التوجيه...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="paper-card">
        <h1 className="display text-2xl mb-6">توزيع البركة</h1>

        {/* Remaining Blessing Total - Admin Only */}
        {isAdmin && inventory && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-primary">إجمالي البركة المتبقية</span>
              <span className="text-2xl font-bold tabular-nums text-primary">
                {inventory.weekly_total}
              </span>
            </div>
          </div>
        )}

        {/* Saint Family Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-muted-foreground mb-2">
            اختر أسرة القديس
          </label>
          <select
            value={selectedFamily}
            onChange={(e) => setSelectedFamily(e.target.value)}
            className="w-full rounded-xl bg-paper px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading}
          >
            <option value="">-- اختر أسرة القديس --</option>
            {FILTERED_SAINT_FAMILIES(role).map((family) => (
              <option key={family.value} value={family.value}>
                {family.label}
              </option>
            ))}
          </select>
        </div>

        {selectedFamily && (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-primary/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-primary tabular-nums">{receivedCount}</div>
                <div className="text-sm text-muted-foreground">استلموا البركة</div>
              </div>
              <div className="bg-muted rounded-xl p-4 text-center">
                <div className="text-3xl font-bold tabular-nums">{notReceivedCount}</div>
                <div className="text-sm text-muted-foreground">لم يستلموا البركة</div>
              </div>
            </div>

            {/* Scanner Active Indicator */}
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 mb-6 flex items-center gap-3">
              <div className="relative">
                <ScanBarcode size={22} className="text-primary" />
                {!scannerProcessing && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-primary">
                  {scannerProcessing ? "جارٍ التسجيل..." : "جاهز لمسح الباركود"}
                </div>
                <div className="text-xs text-muted-foreground">
                  امسح بطاقة المخدوم لتسجيل البركة
                </div>
              </div>
              {lastScannedName && (
                <div className="text-xs bg-success/15 text-success px-3 py-1 rounded-full font-semibold">
                  آخر مسح: {lastScannedName}
                </div>
              )}
            </div>

            {/* Admin Manual Scan Input */}
            {isAdmin && (
              <form
                onSubmit={handleManualScan}
                className="bg-paper-2 rounded-xl p-4 mb-6 flex gap-3 items-center"
              >
                <Search size={20} className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 rounded-xl bg-paper px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                  disabled={manualLoading}
                  autoComplete="off"
                  placeholder="أدخل الرقم القومي للمسح"
                />
                <button
                  type="submit"
                  className="chip-green px-4 py-3 text-sm whitespace-nowrap"
                  disabled={manualLoading || !manualInput.trim()}
                >
                  {manualLoading ? "جاري..." : "مسح الباركود"}
                </button>
              </form>
            )}

            {/* Individuals List */}
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : individuals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا يوجد أفراد مسجلين في هذه الأسرة
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {individuals.map((individual) => {
                  const isReceived = receivedSet.has(individual.id);
                  const toggling = toggleMutation.isPending;
                  return (
                    <div
                      key={individual.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition ${
                        isReceived
                          ? "bg-primary/10 border-2 border-primary"
                          : "bg-paper border-2 border-transparent"
                      }`}
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={isReceived}
                        aria-label={`${individual.full_name} - ${isReceived ? "استلم البركة" : "لم يستلم البركة"}`}
                        onClick={() =>
                          toggleMutation.mutate({
                            saint_family: selectedFamily,
                            individual_id: individual.id,
                          })
                        }
                        disabled={!canToggle || toggling}
                        title={canToggle ? "اضغط لتغيير حالة الاستلام" : "غير مسموح بالتعديل"}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition shrink-0 ${
                          isReceived ? "bg-primary border-primary" : "border-muted-foreground"
                        } ${canToggle && !toggling ? "cursor-pointer hover:opacity-80" : "cursor-default opacity-70"}`}
                      >
                        {isReceived && <Check size={14} className="text-primary-foreground" />}
                      </button>
                      <div className="flex-1">
                        <div className="font-semibold">{individual.full_name}</div>
                        {individual.nickname && (
                          <div className="text-sm text-muted-foreground">{individual.nickname}</div>
                        )}
                      </div>
                      {isReceived && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                          استلم البركة
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
