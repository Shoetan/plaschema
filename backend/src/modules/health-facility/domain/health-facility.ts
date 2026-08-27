export type HealthFacilityWard = {
  id: string;
  name: string;
  lga: string;
};

export type HealthFacility = {
  id: string;
  name: string;
  lga: string;
  wardId: string;
  ward: HealthFacilityWard;
  createdAt: Date;
  updatedAt: Date;
};
