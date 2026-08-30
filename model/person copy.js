// /model/person.js
"use server";
import "server-only";
import Persons from "@/lib/Knex/model/persons";
import {applyConditions} from "@/model/utils";

function basePersonsQuery({
  wherePerson = [],
  whereScreening = [], 
  includeScreening = false,
  mustHaveScreening = false,
  orderBy = {},
  trx = null, 
}) {

  let query = Persons.query(trx);
  query.where(builder => applyConditions(builder, wherePerson));

  if (includeScreening && mustHaveScreening) {

    query = query
      .joinRelated('screenings')
      .where(builder => applyConditions(builder, whereScreening));
  }

  Object.entries(orderBy).forEach(([column, direction]) => {
    query.orderBy(column, direction);
  });

  query = query.withGraphFetched(`
    [
      name_prefixes(namePrefixSelect),
      name_prefixes_en(namePrefixEnSelect),
      sex(sexSelect),
      bloodgroup(bloodGroupSelect),
      nationaliti(nationalitiSelect),
      ethniciti(ethnicitiSelect),
      occupation(occupationSelect),
      organization(organizationSelect),
      healthcare_right(healthcareRightSelect),
      create_by_account(createByAccountSelect),
      persons_addresses.[province(provinceSelect), district(districtSelect), subdistrict(subdistrictSelect)]
      ${includeScreening ? `,
      screenings(screeningsSelect).[ 
        screening_status(statusSelect), 
        biofeedback.create_by_account(bioCreateByAccountSelect), 
        consult.create_by_account(consultCreateByAccountSelect), 
        create_by_account(screeningCreateByAccountSelect)
      ]` : ""}
    ]
  `).modifiers({

    namePrefixSelect(builder) { builder.select('title'); },
    namePrefixEnSelect(builder) { builder.select('title'); },
    sexSelect(builder) { builder.select('title_th'); },
    bloodGroupSelect(builder) { builder.select('title'); },
    nationalitiSelect(builder) { builder.select('title_th'); },
    ethnicitiSelect(builder) { builder.select('title_th'); },
    occupationSelect(builder) { builder.select('title_th'); },
    organizationSelect(builder) { builder.select('title_th'); },
    healthcareRightSelect(builder) { builder.select('title_th'); },
    createByAccountSelect(builder) { builder.select('nickname'); },

    provinceSelect(builder) { builder.select('name_in_thai'); },
    districtSelect(builder) { builder.select('name_in_thai'); },
    subdistrictSelect(builder) { builder.select('name_in_thai','zip_code'); },

    screeningsSelect(builder) {
    if (includeScreening && whereScreening?.length) {
        applyConditions(builder, whereScreening);
      }
    },
    statusSelect(builder) { builder.select('status_name'); },
    screeningCreateByAccountSelect(builder) { builder.select('nickname'); },
    bioCreateByAccountSelect(builder) { builder.select('nickname'); },
    consultCreateByAccountSelect(builder) { builder.select('nickname'); },
  });

  return query;
}

export async function modelPersons(options = {}) {

  const { whereScreening } = options;

  let query = basePersonsQuery(options);
  let result = await query;


  if (whereScreening && result) {
    result = result.map(p => ({
      ...p,
      screenings: p.screenings && p.screenings.length ? p.screenings[0] : null
    }));
  }

  return result;
}

export async function modelPerson(options = {}) {

  const { whereScreening } = options;

  const query = basePersonsQuery(options);
  let result = await query.first();

  if (whereScreening && result) {
    result.screenings = result.screenings && result.screenings.length ? result.screenings[0] : null;
  }

  return result;
}
