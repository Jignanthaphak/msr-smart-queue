// /lib/Knex/model/action_log.js
import "server-only";
import Model from "@/lib/Knex/objection";
import Tbl_account from "@/lib/Knex/model/tbl_account";

export default class Action_logs extends Model {
  static tableName = 'action_logs';
  static idColumn = 'user_id';

  static relationMappings = {

    create_by_account: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Tbl_account,
      join: {
        from: 'action_logs.create_by',
        to: 'tbl_account.user_id',
      },
    },
      
  };
    
}
