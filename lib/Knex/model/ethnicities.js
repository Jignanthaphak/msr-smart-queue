// /lib/Knex/model/ethnicities.js
import "server-only";
import Model from "@/lib/Knex/objection";

export default class Ethnicities extends Model {
  static tableName = 'ethnicities';
  static idColumn = 'ethnicities_id';
}
