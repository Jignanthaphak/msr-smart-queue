// /lib/Knex/model/organizations.js
import "server-only";
import Model from "@/lib/Knex/objection";
import Provinces from "@/lib/Knex/model/provinces";
import Districts from "@/lib/Knex/model/districts";
import Subdistricts from "@/lib/Knex/model/subdistricts";

export default class Organizations extends Model {
  static tableName = 'organizations';
  static idColumn = 'organization_id';

  static relationMappings = {
      province: {
        relation: Model.BelongsToOneRelation,
        modelClass: () => Provinces,
        join: {
          from: 'organizations.province_id',
          to: 'provinces.id',
        },
      },
      district: {
        relation: Model.BelongsToOneRelation,
        modelClass: () => Districts,
        join: {
          from: 'organizations.district_id',
          to: 'districts.id',
        },
      },
      subdistrict: {
        relation: Model.BelongsToOneRelation,
        modelClass: () => Subdistricts,
        join: {
          from: 'organizations.subdistrict_id',
          to: 'subdistricts.id',
        },
      },
    };
}
