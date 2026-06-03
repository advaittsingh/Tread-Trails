import type { Role } from "@tread-trails/shared-constants";

export type ApiUser = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: Role;
  preferredVehicleSlug: string | null;
};

export type LoginResponse = {
  user: ApiUser;
};

export type AuthMeResponse = {
  user: ApiUser;
};
