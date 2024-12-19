import type React from 'react';
import { useEffect, useState } from 'react';
import { StorageKey } from '../../constants/storage';
import type { Setting } from '../../models/storage';
import { getStorageSettingValue } from '../chromeStorage';

export function useClearHistoriesLimit(): [
	Setting['clearHistoriesLimit'],
	React.Dispatch<React.SetStateAction<Setting['clearHistoriesLimit']>>,
] {
	const [clearHistoriesLimit, setClearHistoriesLimit] =
		useState<Setting['clearHistoriesLimit']>();

	useEffect(() => {
		(async () => {
			const setting: Setting = await getStorageSettingValue(StorageKey.setting);
			setClearHistoriesLimit(setting?.clearHistoriesLimit);
		})();
	}, []);

	return [clearHistoriesLimit, setClearHistoriesLimit];
}
