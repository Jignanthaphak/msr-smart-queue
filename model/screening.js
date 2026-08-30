// /model/screening.js
"use server";
import "server-only";
import Screening from "@/lib/Knex/model/screening";
import {applyConditions} from "@/model/utils";


function baseScreeningQuery({
  whereScreening = [],
  wherePerson = [], 
  includePerson = false,
  mustHavePerson = false,
  orderBy = {},
  trx = null,
}) {
  let query = Screening.query(trx);

  query.where(builder => applyConditions(builder, whereScreening));

  if (includePerson && mustHavePerson) {
    query = query
      .joinRelated('person')
      .where(builder => applyConditions(builder, wherePerson));
  }
  
  Object.entries(orderBy).forEach(([column, direction]) => {
    query.orderBy(column, direction);
  });

  query = query.withGraphFetched(`
    [ 
      screening_status(screeningStatusSelect),
      biofeedback.[create_by_account(bioCreateByAccountSelect)], 
      consult.[create_by_account(consultCreateByAccountSelect)], 
      create_by_account(screeningCreateByAccountSelect)
      ${includePerson ? `,
      person(personSelect).[ 
        name_prefixes(namePrefixSelect),
        name_prefixes_en(namePrefixEnSelect),
        sex(sexSelect),
        bloodgroup(bloodGroupSelect),
        nationaliti(nationalitiSelect),
        ethniciti(ethnicitiSelect),
        occupation(occupationSelect),
        organization(organizationSelect).[
          province(provinceSelect)
        ],
        healthcare_right(healthcareRightSelect),
        create_by_account(createByAccountSelect),
        persons_addresses.[
          province(provinceSelect), district(districtSelect), subdistrict(subdistrictSelect)
        ]
      ]` : ""}
    ]
  `).modifiers({
    screeningStatusSelect(builder) { builder.select("status_name"); },
    screeningCreateByAccountSelect(builder) { builder.select("nickname"); },
    bioCreateByAccountSelect(builder) { builder.select("nickname"); },
    consultCreateByAccountSelect(builder) { builder.select("nickname"); },

    // person related modifiers (ใช้ได้ถ้า includePerson = true)
    personSelect(builder) {
    if (includePerson && wherePerson?.length) {
        applyConditions(builder, wherePerson);
      }
    },

    namePrefixSelect(builder) { builder.select("title"); },
    namePrefixEnSelect(builder) { builder.select("title"); },
    sexSelect(builder) { builder.select("title_th"); },
    bloodGroupSelect(builder) { builder.select("title"); },
    nationalitiSelect(builder) { builder.select("title_th"); },
    ethnicitiSelect(builder) { builder.select("title_th"); },
    occupationSelect(builder) { builder.select("title_th"); },
    organizationSelect(builder) { builder.select("title_th", "province_id"); },
    healthcareRightSelect(builder) { builder.select("title_th"); },
    createByAccountSelect(builder) { builder.select("nickname"); },

    provinceSelect(builder) { builder.select("name_in_thai"); },
    districtSelect(builder) { builder.select("name_in_thai"); },
    subdistrictSelect(builder) { builder.select("name_in_thai","zip_code"); },
  });

  return query;
}

export async function modelScreenings(options = {}) {
  const query = baseScreeningQuery(options);
  return await query;
}

export async function modelScreening(options = {}) {
  const query = baseScreeningQuery(options);
  return await query.first();
}



