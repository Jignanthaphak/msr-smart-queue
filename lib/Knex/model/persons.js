// /lib/Knex/model/persons.js
import "server-only";
import Model from "@/lib/Knex/objection";
import Name_prefixes from "@/lib/Knex/model/name_prefixes";
import Sex from "@/lib/Knex/model/sex";
import Bloodgroup from "@/lib/Knex/model/bloodgroup";
import Nationalities from "@/lib/Knex/model/nationalities";
import Ethnicities from "@/lib/Knex/model/ethnicities";
import Occupations from "@/lib/Knex/model/occupations";
import Organizations from "@/lib/Knex/model/organizations";
import Healthcare_right from "@/lib/Knex/model/healthcare_right";
import Tbl_account from "@/lib/Knex/model/tbl_account";
import Persons_address from "@/lib/Knex/model/persons_address";
import Screening from "@/lib/Knex/model/screening";

export default class Persons extends Model {
  static tableName = 'persons';
  static idColumn = 'hn';

  static relationMappings = {
    name_prefixes: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Name_prefixes,
      join: {
        from: 'persons.prefix_id',
        to: 'name_prefixes.prefix_id',
      },
    },
    name_prefixes_en: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Name_prefixes,
      join: {
        from: 'persons.prefix_id',
        to: 'name_prefixes.prefix_id',
      },
    },
    sex: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Sex,
      join: {
        from: 'persons.sex_id',
        to: 'sex.sex_id',
      },
    },
    bloodgroup: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Bloodgroup,
      join: {
        from: 'persons.bloodgroup_id',
        to: 'bloodgroup.bloodgroup_id',
      },
    },
    nationaliti: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Nationalities,
      join: {
        from: 'persons.nationalities_id',
        to: 'nationalities.nationalities_id',
      },
    },
    ethniciti: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Ethnicities,
      join: {
        from: 'persons.ethnicities_id',
        to: 'ethnicities.ethnicities_id',
      },
    },
    occupation: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Occupations,
      join: {
        from: 'persons.occupation_id',
        to: 'occupations.occupation_id',
      },
    },
    organization: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Organizations,
      join: {
        from: 'persons.organization_id',
        to: 'organizations.organization_id',
      },
    },
    healthcare_right: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Healthcare_right,
      join: {
        from: 'persons.healthcare_right_id',
        to: 'healthcare_right.healthcare_right_id',
      },
    },
    create_by_account: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Tbl_account,
      join: {
        from: 'persons.create_by',
        to: 'tbl_account.user_id',
      },
    },
    persons_addresses: {
      relation: Model.HasManyRelation,
      modelClass: () => Persons_address,
      join: {
        from: 'persons.hn',
        to: 'persons_address.hn',
      },
    },
    screenings: {
      relation: Model.HasManyRelation, 
      modelClass: () => Screening,
      join: {
        from: 'persons.hn',
        to: 'screening.hn',
      },
    },
  };
}
