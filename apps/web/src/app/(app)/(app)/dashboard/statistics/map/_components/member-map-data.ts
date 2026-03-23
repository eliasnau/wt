export type MemberMapRecord = {
	memberId: string;
	city: string;
	postalCode: string;
	country: string;
	latitude: number | null;
	longitude: number | null;
	groupIds: string[];
};

export type MemberFeatureProperties = {
	memberId: string;
	city: string;
	postalCode: string;
	groupIds: string[];
};

export const SCHOOL_CENTER: [number, number] = [12.1281, 47.8561];

const cityCenterLookup: Record<string, [number, number]> = {
	stephanskirchen: [12.1833, 47.85],
	rosenheim: [12.1281, 47.8561],
	"bad aibling": [12.01, 47.8639],
	kolbermoor: [12.0667, 47.85],
	"prien am chiemsee": [12.3456, 47.8567],
	"wasserburg am inn": [12.2306, 48.0569],
	raubling: [12.1167, 47.7833],
	bruckmuhl: [11.9167, 47.8833],
	bruckmühl: [11.9167, 47.8833],
	"feldkirchen-westerham": [11.85, 47.9],
	grosskarolinenfeld: [12.0833, 47.9],
	großkarolinenfeld: [12.0833, 47.9],
	schechen: [12.15, 47.9333],
	tuntenhausen: [12.0167, 47.9333],
	"bad feilnbach": [12.0, 47.7667],
	rohrdorf: [12.1833, 47.7833],
	neubeuern: [12.1333, 47.7667],
	samerberg: [12.2, 47.75],
	riedering: [12.2167, 47.8333],
	söchtenau: [12.25, 47.9167],
	soechtenau: [12.25, 47.9167],
	halfing: [12.2833, 47.95],
	vogtareuth: [12.1667, 47.95],
};

function normalizeCityKey(city: string) {
	return city.trim().toLowerCase();
}

function hashString(value: string) {
	let hash = 0;
	for (let index = 0; index < value.length; index += 1) {
		hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
	}
	return hash;
}

function lookupCityCenter(city: string, postalCode: string): [number, number] {
	const known = cityCenterLookup[normalizeCityKey(city)];
	if (known) {
		return known;
	}

	const hash = hashString(`${postalCode}:${city}`);
	const angle = (hash % 360) * (Math.PI / 180);
	const distanceKm = 5 + ((hash >> 8) % 14);
	const spreadLng = distanceKm / 85;
	const spreadLat = distanceKm / 111;

	return [
		SCHOOL_CENTER[0] + Math.cos(angle) * spreadLng,
		SCHOOL_CENTER[1] + Math.sin(angle) * spreadLat,
	];
}

function getCitySpread(memberCount: number) {
	if (memberCount >= 100) return 2.5;
	if (memberCount >= 50) return 1.8;
	if (memberCount >= 20) return 1.2;
	if (memberCount >= 10) return 0.9;
	return 0.6;
}

export function filterMembersByGroups(
	members: MemberMapRecord[],
	selectedGroupIds: string[],
) {
	if (selectedGroupIds.length === 0) {
		return members;
	}

	return members.filter((member) =>
		selectedGroupIds.some((groupId) => member.groupIds.includes(groupId)),
	);
}

export function getCitySummaries(members: MemberMapRecord[]) {
	const counts = new Map<
		string,
		{ city: string; postalCode: string; count: number }
	>();

	for (const member of members) {
		const key = `${member.postalCode}:${member.city}`;
		const existing = counts.get(key);
		if (existing) {
			existing.count += 1;
			continue;
		}

		counts.set(key, {
			city: member.city,
			postalCode: member.postalCode,
			count: 1,
		});
	}

	return Array.from(counts.values()).sort(
		(left, right) => right.count - left.count,
	);
}

export function buildMemberFeatureCollection(
	members: MemberMapRecord[],
): GeoJSON.FeatureCollection<GeoJSON.Point, MemberFeatureProperties> {
	const cityCounts = new Map<string, number>();
	for (const member of members) {
		const key = `${member.postalCode}:${member.city}`;
		cityCounts.set(key, (cityCounts.get(key) ?? 0) + 1);
	}

	const features = members.map((member) => {
		const cityKey = `${member.postalCode}:${member.city}`;
		const memberCount = cityCounts.get(cityKey) ?? 1;
		const [baseLng, baseLat] = lookupCityCenter(member.city, member.postalCode);
		const sourceLng = member.longitude ?? baseLng;
		const sourceLat = member.latitude ?? baseLat;
		const hasExactCoordinates =
			member.latitude != null && member.longitude != null;
		const spread = hasExactCoordinates ? 0 : getCitySpread(memberCount);
		const spreadLng = spread / 85;
		const spreadLat = spread / 111;
		const hash = hashString(`${member.memberId}:${cityKey}`);
		const angle = ((hash % 3600) / 10) * (Math.PI / 180);
		const distance = (((hash >> 6) % 1000) / 1000) ** 0.7;
		const jitter = (((hash >> 12) % 1000) / 1000 - 0.5) * 0.2;

		return {
			type: "Feature",
			properties: {
				memberId: member.memberId,
				city: member.city,
				postalCode: member.postalCode,
				groupIds: member.groupIds,
			},
			geometry: {
				type: "Point",
				coordinates: [
					sourceLng +
						Math.cos(angle) * distance * spreadLng +
						jitter * spreadLng,
					sourceLat +
						Math.sin(angle) * distance * spreadLat +
						jitter * spreadLat,
				],
			},
		} satisfies GeoJSON.Feature<GeoJSON.Point, MemberFeatureProperties>;
	});

	return {
		type: "FeatureCollection",
		features,
	};
}
