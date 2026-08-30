// /lib/Knex/model/screening.js
import "server-only";
import Model from "@/lib/Knex/objection";
import Screening_status from "@/lib/Knex/model/screening_status";
import Tbl_account from "@/lib/Knex/model/tbl_account";
import Persons from "@/lib/Knex/model/persons";
import Biofeedback from "@/lib/Knex/model/biofeedback";
import Consult from "@/lib/Knex/model/consult";

export default class Screening extends Model {
  static tableName = 'screening';
  static idColumn = 'screening_id';

  static relationMappings = {
    screening_status: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Screening_status,
      join: {
        from: 'screening.status_id',
        to: 'screening_status.status_id',
      },
    },
    create_by_account: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Tbl_account,
      join: {
        from: 'screening.create_by',
        to: 'tbl_account.user_id',
      },
    },
    person: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Persons,
      join: {
        from: 'screening.hn',
        to: 'persons.hn',
      },
    },
    biofeedback: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Biofeedback,
      join: {
        from: 'screening.screening_id',
        to: 'biofeedback.screening_id',
      },
    },
    consult: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Consult,
      join: {
        from: 'screening.screening_id',
        to: 'consult.screening_id',
      },
    },
    
  };
}

