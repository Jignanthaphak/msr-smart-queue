// /lib/Knex/model/tbl_role_permission.js
import "server-only";
import Model from "@/lib/Knex/objection";
import Tbl_role from "@/lib/Knex/model/tbl_role";
import Tbl_permission from "@/lib/Knex/model/tbl_permission";

export default class Tbl_role_permission extends Model {
  static tableName = 'tbl_role_permission';
  static idColumn = 'permission_id';

  static relationMappings = {
  
    role: {
      relation: Model.BelongsToOneRelation, 
      modelClass: () => Tbl_role,
      join: {
        from: 'tbl_role_permission.role_id',
        to: 'tbl_role.role_id',
      },
    },
    permission: {
      relation: Model.BelongsToOneRelation, 
      modelClass: () => Tbl_permission,
      join: {
        from: 'tbl_role_permission.permission_id',
        to: 'tbl_permission.permission_id',
      },
    },
      
  };
}
