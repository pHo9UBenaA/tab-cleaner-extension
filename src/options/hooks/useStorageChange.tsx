import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { ClearHistory, Domain } from '../../models/storage';

export function useStorageChange<T extends (Domain | ClearHistory)[]>(
	key: string
): [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>] {
	const [value, setValue] = useState<T>();

	const getCallback = useCallback(
		(data: { [key: string]: T }) => {
			setValue(data[key] || undefined);
		},
		[key]
	);
	const onChangeCallback = useCallback(
		(changes: { [key: string]: chrome.storage.StorageChange }) => {
			if (changes[key]) {
				setValue(changes[key].newValue || undefined);
			}
		},
		[key]
	);
	useEffect(() => {
		chrome.storage.local.get(key, (data) => getCallback(data));
		chrome.storage.local.onChanged.addListener((changes) => onChangeCallback(changes));
	}, [key, getCallback, onChangeCallback]);

	return [value, setValue];
}
