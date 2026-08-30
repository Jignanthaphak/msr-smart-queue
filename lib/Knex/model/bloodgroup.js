// /lib/Knex/model/bloodgroup.js
import "server-only";
import Model from "@/lib/Knex/objection";

export default class Bloodgroup extends Model {
  static tableName = 'bloodgroup';
  static idColumn = 'bloodgroup_id';
}
