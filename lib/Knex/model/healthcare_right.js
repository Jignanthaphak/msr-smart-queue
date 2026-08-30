// /lib/Knex/model/healthcare_right.js
import "server-only";
import Model from "@/lib/Knex/objection";

export default class Healthcare_right extends Model {
  static tableName = 'healthcare_right';
  static idColumn = 'healthcare_right_id';
}
