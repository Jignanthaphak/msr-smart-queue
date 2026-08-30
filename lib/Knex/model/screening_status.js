// /lib/Knex/model/screening_status.js
import "server-only";
import Model from "@/lib/Knex/objection";

export default class Screening_status extends Model {
  static tableName = 'screening_status';
  static idColumn = 'status_id';
}
