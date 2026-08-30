// /lib/Knex/model/provinces.js
import "server-only";
import Model from "@/lib/Knex/objection";

export default class Provinces extends Model {
  static tableName = 'provinces';
  static idColumn = 'id';
}
