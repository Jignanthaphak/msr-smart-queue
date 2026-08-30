// /lib/Knex/model/consult.js
import "server-only";
import Model from "@/lib/Knex/objection";
import Tbl_account from "@/lib/Knex/model/tbl_account";

export default class Consult extends Model {
  static tableName = 'consult';
  static idColumn = 'consult_id';

  static relationMappings = {
      create_by_account: {
        relation: Model.BelongsToOneRelation,
        modelClass: () => Tbl_account,
        join: {
          from: 'consult.create_by',
          to: 'tbl_account.user_id',
        },
      },
      follow_status_by_account: {
        relation: Model.BelongsToOneRelation,
        modelClass: () => Tbl_account,
        join: {
          from: 'consult.follow_status_by',
          to: 'tbl_account.user_id',
        },
      },
    };

}
