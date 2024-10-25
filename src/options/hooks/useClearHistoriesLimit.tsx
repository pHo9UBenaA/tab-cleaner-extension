import type React from 'react';
import { useEffect, useState } from 'react';
import { StorageKey } from '../../constants/storage';
import type { Setting } from '../../models/storage';

// TODO
const getStorageSettingValue = (key: string): Promise<Setting> => {
	return new Promise((resolve) => {
		chrome.storage.local.get(key, (result) => {
			resolve(result[key] || {});
		});
	});
};

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
