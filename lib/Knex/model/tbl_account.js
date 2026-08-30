// /lib/Knex/model/tbl_account.js
import "server-only";
import Model from "@/lib/Knex/objection";
import Screening from "@/lib/Knex/model/screening";
import Persons from "@/lib/Knex/model/persons";
import Tbl_role from "@/lib/Knex/model/tbl_role";

export default class Tbl_account extends Model {
  static tableName = 'tbl_account';
  static idColumn = 'user_id';

  static relationMappings = {

    screenings: {
      relation: Model.HasManyRelation, 
      modelClass: () => Screening,
      join: {
        from: 'tbl_account.user_id',
        to: 'screening.create_by',
      },
    },

    persons: {
      relation: Model.HasManyRelation, 
      modelClass: () => Persons,
      join: {
        from: 'tbl_account.user_id',
        to: 'persons.create_by',
      },
    },
    role: {
      relation: Model.BelongsToOneRelation, 
      modelClass: () => Tbl_role,
      join: {
        from: 'tbl_account.role_id',
        to: 'tbl_role.role_id',
      },
    },

      
    };
    
}
