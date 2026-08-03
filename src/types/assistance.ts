// Assistance Module Types

export type AssistanceType = 'bridal_prep' | 'medical_aid';

export type AssistanceLog = {
  id: string;
  individual_id: string;
  family_member_id: string | null;
  assistance_type: AssistanceType;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  bridal_prep_details?: any[];
  medical_aid_details?: any[];
  family_members?: { full_name: string };
};

// Bridal Preparation Types
export type BridalCategory = 'appliances' | 'furniture' | 'clothing' | 'kitchenware' | 'bedding';

export const APPLIANCE_TYPES = [
  'تلاجة', 'غسالة', 'ميكروويف', 'خلاط', 'فرن', 'بوتاجاز', 'مروحة', 'تلفزيون'
] as const;

export const FURNITURE_TYPES = [
  'غرفة نوم', 'كنبة', 'أنتريه', 'كرسي', 'ترابيزة سفرة', 'نيش', 'بوفيه', 'طاولة'
] as const;

export const KITCHENWARE_TYPES = [
  'طبق', 'معلقة', 'كوباية', 'طاسة', 'حلة', 'شوكة', 'سكين', 'مصفاة'
] as const;

export const CLOTHING_TYPES = [
  'تي شيرت', 'بنطلون', 'بلوزة', 'فستان', 'جاكيت / كوت', 'قميص', 'غيارات', 'أخرى'
] as const;

export const BEDDING_TYPES = [
  'ملاية', 'مخدة', 'بطانية', 'سجادة', 'ستارة', 'وسادة', 'غطاء'
] as const;

export type BridalPrepDetail = {
  id?: string;
  category: BridalCategory;
  item_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

// Medical Aid Types
export type MedicalCategory = 'operation' | 'radiology' | 'lab_test' | 'medication' | 'checkup' | 'external_treatment';

export const MEDICAL_CATEGORIES = [
  { value: 'operation', label: 'عملية' },
  { value: 'radiology', label: 'إشاعة' },
  { value: 'lab_test', label: 'تحليل' },
  { value: 'medication', label: 'علاجات' },
  { value: 'checkup', label: 'كشف' },
  { value: 'external_treatment', label: 'علاج خارجي' },
] as const;

export type MedicalAidDetail = {
  id?: string;
  category: MedicalCategory;
  service_name: string;
  total_price: number;
  church_percentage: number;
  church_amount: number;
};

// Form State Types
export type AssistanceFormData = {
  family_member_id: string | null;
  assistance_type: AssistanceType;
  notes: string;
  bridal_details: {
    appliances: BridalPrepDetail[];
    furniture: BridalPrepDetail[];
    clothing: BridalPrepDetail[];
    kitchenware: BridalPrepDetail[];
    bedding: BridalPrepDetail[];
  };
  medical_details: MedicalAidDetail[];
};
