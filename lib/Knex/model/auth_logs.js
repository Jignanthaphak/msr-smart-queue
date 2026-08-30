// /lib/Knex/model/auth_logs.js
import "server-only";
import Model from "@/lib/Knex/objection";
import Tbl_account from "@/lib/Knex/model/tbl_account";

export default class Auth_logs extends Model {
  static tableName = 'auth_logs';
  static idColumn = 'user_id';

  static relationMappings = {

    create_by_account: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Tbl_account,
      join: {
        from: 'auth_logs.create_by',
        to: 'tbl_account.user_id',
      },
    },
      
  };
    
}
