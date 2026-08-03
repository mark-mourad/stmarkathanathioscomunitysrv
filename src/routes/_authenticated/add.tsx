import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createIndividual } from "@/lib/church.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { IndividualForm, buildIndividualPayload } from "@/components/individual-form";

export const Route = createFileRoute("/_authenticated/add")({
  head: () => ({ meta: [{ title: "إضافة مخدوم" }] }),
  component: AddPage,
});

function AddPage() {
  const { role, can, assignedFamily, isFamilyServant } = useAuth();
  const router = useRouter();
  const submit = useServerFn(createIndividual);
  const [busy, setBusy] = useState(false);

  const addRestricted = ["SUPPLY_WAREHOUSE_MANAGER", "FURNITURE_WAREHOUSE_MANAGER", "PHARMACY_WAREHOUSE_MANAGER", "BRIDE_AND_MEDICAL_AIDS_MANAGER", "BLESSING_DISTRIBUTOR"];

  useEffect(() => {
    if (addRestricted.includes(role as any)) {
      toast.error("غير مصرح لك بهذا الحقل");
      router.navigate({ to: "/" });
    }
  }, [role]);

  if (addRestricted.includes(role as any)) {
    return <div className="text-center py-8 text-muted-foreground">جاري التوجيه...</div>;
  }

  if (!can("add:beneficiary")) {
    return <div className="paper-card text-center">غير مصرح. للقراءة فقط.</div>;
  }

  async function onSubmit(formData: Parameters<typeof buildIndividualPayload>[0]): Promise<void> {
    if (!formData.ind.full_name) { toast.error("الاسم مطلوب"); return; }
    if (!formData.ind.national_id || formData.ind.national_id.length !== 14) {
      toast.error("الرقم القومي مطلوب ويجب أن يكون 14 رقم");
      return;
    }
    setBusy(true);
    try {
      const res = await submit({ data: buildIndividualPayload(formData) });
      toast.success("تم حفظ المخدوم");
      router.navigate({ to: "/individual/$id", params: { id: res.id } });
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <IndividualForm
      submitLabel="حفظ المخدوم"
      busy={busy}
      onSubmit={onSubmit}
      onCancel={() => router.history.back()}
      initialInd={isFamilyServant && assignedFamily ? { saint_family: assignedFamily } : {}}
      lockFamily={isFamilyServant}
      role={role}
    />
  );
}
