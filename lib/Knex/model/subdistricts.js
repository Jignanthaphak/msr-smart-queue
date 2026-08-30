// /lib/Knex/model/subdistricts.js
import "server-only";
import Model from "@/lib/Knex/objection";

export default class Subdistricts extends Model {
  static tableName = 'subdistricts';
  static idColumn = 'id';
}
