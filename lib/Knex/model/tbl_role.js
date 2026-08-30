// /lib/Knex/model/tbl_role.js
import "server-only";
import Model from "@/lib/Knex/objection";
import Tbl_role_permission from "@/lib/Knex/model/tbl_role_permission";
import Tbl_account from "@/lib/Knex/model/tbl_account";

export default class Tbl_role extends Model {
  static tableName = 'tbl_role';
  static idColumn = 'role_id';

  static relationMappings = {

    permissions: {
      relation: Model.HasManyRelation, 
      modelClass: () => Tbl_role_permission,
      join: {
        from: 'tbl_role.role_id',
        to: 'tbl_role_permission.role_id',
      },
    },
    accounts: {
      relation: Model.HasManyRelation, 
      modelClass: () => Tbl_account,
      join: {
        from: 'tbl_role.role_id',
        to: 'tbl_account.role_id',
      },
    },
        
  };

}
