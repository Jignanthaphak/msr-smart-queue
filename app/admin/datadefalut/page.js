"use client"
import React from 'react';
import OrganizationTable from '@/components/admin/organization/OrganizationTable';
import HealthcareTable from '@/components/admin/healthcare/HealthcareTable';
import OccupationTable from '@/components/admin/occupation/OccupationTable';
export default function Page() {

  return (
    <>
      <OrganizationTable/>
      <HealthcareTable/>
      <OccupationTable/>
    </>
  );
};
