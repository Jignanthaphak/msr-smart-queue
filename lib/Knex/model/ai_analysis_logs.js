// /lib/Knex/model/ai_analysis_logs.js
import "server-only";
import Model from "@/lib/Knex/objection";
import Tbl_account from "@/lib/Knex/model/tbl_account";

export default class Ai_analysis_logs extends Model {
  static tableName = 'ai_analysis_logs';
  static idColumn = 'id';

  static relationMappings = {
    create_by_account: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Tbl_account,
      join: {
        from: 'ai_analysis_logs.create_by',
        to: 'tbl_account.user_id',
      },
    },
  };
}
