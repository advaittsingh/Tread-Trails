import type { User } from "@prisma/client";

import type { Role } from "@tread-trails/shared-constants";
import type { ApiUser } from "@tread-trails/shared-types";

export function toApiUser(user: User): ApiUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone ?? null,
    role: user.role as Role,
    preferredVehicleSlug: user.preferredVehicleSlug ?? null,
  };
}
