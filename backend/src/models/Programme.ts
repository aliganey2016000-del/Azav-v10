import mongoose, { Schema, Document } from 'mongoose';

export interface IProgramme extends Document {
  name: string;
  code: string;
  description?: string;
  durationMonths: number;
  status: 'ACTIVE' | 'INACTIVE';
}

const ProgrammeSchema = new Schema<IProgramme>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    durationMonths: { type: Number, default: 6 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const Programme =
  (mongoose.models.Programme as mongoose.Model<IProgramme>) ||
  mongoose.model<IProgramme>('Programme', ProgrammeSchema);

export interface ISpecialty extends Document {
  name: string;
  code: string;
  category?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const SpecialtySchema = new Schema<ISpecialty>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    category: { type: String },
    description: { type: String },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const Specialty =
  (mongoose.models.Specialty as mongoose.Model<ISpecialty>) ||
  mongoose.model<ISpecialty>('Specialty', SpecialtySchema);

export interface ICountry extends Document {
  name: string;
  code: string;
  iso2: string;
  phoneCode?: string;
}

const CountrySchema = new Schema<ICountry>(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    iso2: { type: String, required: true, uppercase: true },
    phoneCode: { type: String },
  },
  { timestamps: true }
);

export const Country =
  (mongoose.models.Country as mongoose.Model<ICountry>) ||
  mongoose.model<ICountry>('Country', CountrySchema);

export interface ICity extends Document {
  name: string;
  countryId: mongoose.Types.ObjectId;
  code?: string;
}

const CitySchema = new Schema<ICity>(
  {
    name: { type: String, required: true },
    countryId: { type: Schema.Types.ObjectId, ref: 'Country', required: true, index: true },
    code: { type: String },
  },
  { timestamps: true }
);

export const City =
  (mongoose.models.City as mongoose.Model<ICity>) ||
  mongoose.model<ICity>('City', CitySchema);
