GRANT DELETE ON public.audit_log TO authenticated;

CREATE POLICY "audit_delete_admin" ON public.audit_log
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
