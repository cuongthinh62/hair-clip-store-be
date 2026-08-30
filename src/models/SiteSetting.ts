import { Schema, model, Document } from 'mongoose'

export interface ISiteSetting extends Document {
  zaloPhone: string
  zaloLink: string
  storeAddress?: string
  hotline?: string
  createdAt?: Date
  updatedAt?: Date
}

const siteSettingSchema = new Schema<ISiteSetting>(
  {
    zaloPhone: { type: String, required: true },
    zaloLink: { type: String, required: true },
    storeAddress: { type: String, default: '' },
    hotline: { type: String, default: '' }
  },
  { timestamps: true }
)

export const SiteSetting = model<ISiteSetting>('SiteSetting', siteSettingSchema)
