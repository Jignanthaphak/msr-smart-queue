// /lib/Knex/model/biofeedback.js
import "server-only";
import Model from "@/lib/Knex/objection";
import Tbl_account from "@/lib/Knex/model/tbl_account";

export default class Biofeedback extends Model {
  static tableName = 'biofeedback';
  static idColumn = 'biofeedback_id';

  static relationMappings = {
        create_by_account: {
          relation: Model.BelongsToOneRelation,
          modelClass: () => Tbl_account,
          join: {
            from: 'biofeedback.create_by',
            to: 'tbl_account.user_id',
          },
        },
      };
}
