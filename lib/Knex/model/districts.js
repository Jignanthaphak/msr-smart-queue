// /lib/Knex/model/districts.js
import "server-only";
import Model from "@/lib/Knex/objection";

export default class Districts extends Model {
  static tableName = 'districts';
  static idColumn = 'id';
}
