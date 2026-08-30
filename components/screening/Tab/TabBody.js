// /components/screening/Tab/TabBody.js
'use client';

import TabHome from '@/components/screening/Home/TabHome3';
import TabPerson from '@/components/screening/Person/TabPerson';
import TabBio from '@/components/screening/Bio/TabBio';
import TabConsult from '@/components/screening/Consult/TabConsult';
export default function TabBody({activeId}) {
   
    return (
      <>
        <TabHome open={activeId === 1} />
        <TabPerson open={activeId === 2} />
        <TabBio open={activeId === 3} />
        <TabConsult open={activeId === 4} />
      </>
    );
  }