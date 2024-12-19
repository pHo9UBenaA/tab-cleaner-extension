import {
	Box,
	Button,
	ChakraProvider,
	Divider,
	Flex,
	Heading,
	Stack,
	VStack,
	useDisclosure,
} from '@chakra-ui/react';
import React, { useRef, useState } from 'react';
import * as ReactDOM from 'react-dom/client';
import { StorageKey } from './constants/storage';
import { handleClearTabEvent } from './handles/clear-tab';
import type { ClearHistory, Domain, Setting } from './models/storage';
import { ConfirmDialog, type DialogProperty } from './options/components/ConfirmDialog';
import { ClearHistoryList } from './options/features/ClearHistoryList';
import { DomainInput } from './options/features/DomainInput';
import { DomainList } from './options/features/DomainList';
import { FileDownloadButton } from './options/features/FileDownloadButton';
import { FileUploadButton } from './options/features/FileUploadButton';
import { SelectCleanHistoryLimit } from './options/features/SelectCleanHistoryLimit';
import { SettingToggle } from './options/features/SettingToggle';
import { useClearHistoriesLimit } from './options/hooks/useClearHistoriesLimit';
import { useSettingToggleChange } from './options/hooks/useSettingToggleChange';
import { useStorageChange } from './options/hooks/useStorageChange';
import { getStorageSettingValue } from './options/chromeStorage';

const initDialogProperty: DialogProperty = {
	title: '',
	confirmMessage: '',
	actionMessage: 'Clear',
	handleAction: () => {},
};

const domainRegister = async (
	urlHostname: string,
	setDomains: React.Dispatch<React.SetStateAction<Domain[] | undefined>>
) => {
	const urlHostnameWithoutScheme = urlHostname.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '');

	if (!urlHostnameWithoutScheme) {
		console.error('urlHostnameWithoutScheme is undefined');
		return;
	}

	const prevDomains: Domain[] = await new Promise((resolve) => {
		chrome.storage.local.get(StorageKey.domains, (data) => {
			resolve(data[StorageKey.domains] || []);
		});
	});

	const isDuplicate = prevDomains.some((prevDomain) => {
		if (typeof prevDomain === 'string') {
			return prevDomain === urlHostnameWithoutScheme;
		}
		return prevDomain.name === urlHostnameWithoutScheme;
	});
	if (isDuplicate) {
		console.info('Duplicate domain');
		return;
	}

	const uniqueDomains: Domain[] = [
		...new Set([
			...prevDomains,
			{
				uuid: crypto.randomUUID(),
				name: urlHostnameWithoutScheme,
			},
		]),
	];

	return new Promise((resolve) => {
		chrome.storage.local.set(
			{
				[StorageKey.domains]: uniqueDomains,
			},
			() => {
				setDomains(uniqueDomains);
				resolve(null);
			}
		);
	});
};

function Options() {
	const cancelRef = useRef(null);
	const [dialogProperty, setDialogProperty] = useState<DialogProperty>(initDialogProperty);
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [removeNewTabId, removeNewTabIsChecked, removeNewTabSetIsChecked] =
		useSettingToggleChange('enableAutoRemoveNewTab');
	const [removeOtherDomainsId, removeOtherDomainsIsChecked, removeOtherDomainsSetIsChecked] =
		useSettingToggleChange('removeOtherDomains');
	const [domains, setDomains] = useStorageChange<Domain[]>(StorageKey.domains);
	const [clearHistories, setClearHistories] = useStorageChange<ClearHistory[]>(
		StorageKey.clearHistories
	);
	const [clearHistoriesLimit, setClearHistoriesLimit] = useClearHistoriesLimit();

	const handleClickSettingToggle =
		(key: keyof Setting, setIsChecked: ReturnType<typeof useSettingToggleChange>[2]) =>
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const value = event.target.checked;
			setIsChecked(value);
			const storageValue: Setting = await new Promise((resolve) => {
				chrome.storage.local.get(StorageKey.setting, (result) => {
					resolve(result[StorageKey.setting] || {});
				});
			});
			// keyをもとにnewStorageValueを作成
			const newStorageValue = { ...storageValue, [key]: value };
			chrome.storage.local.set({ [StorageKey.setting]: newStorageValue });
		};

	const handleDomainSubmit = (urlHostname: string) => {
		domainRegister(urlHostname, setDomains);
	};

	const handleFileDownload = async () => {
		const getFormattedDate = () => {
			const date = new Date();
			const formattedDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(
				2,
				'0'
			)}${String(date.getDate()).padStart(2, '0')}${String(date.getHours()).padStart(
				2,
				'0'
			)}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(
				2,
				'0'
			)}`.concat(String(date.getMilliseconds()).padStart(3, '0'));
			return formattedDate;
		};

		if (!domains) {
			console.error('domains is empty');
			return;
		}
		const content = domains
			.map((domain) => (typeof domain === 'string' ? domain : domain.name))
			.join('\n');
		const blob = new Blob([content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `domains_${getFormattedDate()}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleFileUpload = async (content: string) => {
		const lines = content.split('\n').filter((line) => line.trim() !== '');
		for (const line of lines) {
			try {
				const lineAddSchema = line.includes('://') ? line : `http://${line}`;
				const url = new URL(lineAddSchema);
				await domainRegister(url.hostname, setDomains);
			} catch {
				console.error('Invalid URL:', line);
			}
		}
	};

	const handleClearDomains = () => {
		setDialogProperty({
			title: 'Clear Target Domains',
			confirmMessage: 'Are you sure you want to clear all target domains?',
			actionMessage: 'Clear',
			handleAction: () => {
				chrome.storage.local.remove(StorageKey.domains);
				setDomains([]);
			},
		});
		onOpen();
	};

	const handleRemoveDomain = (uuid: string) => {
		chrome.storage.local.get(StorageKey.domains, (data) => {
			const prevDomains: Domain[] = data[StorageKey.domains] || [];
			const newDomains = prevDomains.filter(
				(domain) => typeof domain === 'string' || domain.uuid !== uuid
			);
			chrome.storage.local.set({ [StorageKey.domains]: newDomains }, () => {
				setDomains(newDomains);
			});
		});
	};

	const handleClearHistories = () => {
		setDialogProperty({
			title: 'Clear Cleaned History',
			confirmMessage: 'Are you sure you want to clear all cleaned history?',
			actionMessage: 'Clear',
			handleAction: () => {
				chrome.storage.local.remove(StorageKey.clearHistories);
				setClearHistories([]);
			},
		});
		onOpen();
	};

	const handleClearHistoriesLimitChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
		const newValue = Number.isNaN(Number(event.target.value))
			? undefined
			: Number(event.target.value);
		setClearHistoriesLimit(newValue);
		const storageValue: Setting = await getStorageSettingValue(StorageKey.setting);
		const newStorageValue = { ...storageValue, clearHistoriesLimit: newValue };
		await chrome.storage.local.set({ [StorageKey.setting]: newStorageValue });
	};

	return (
		<VStack spacing={5} align='start'>
			<ConfirmDialog
				isOpen={isOpen}
				onClose={onClose}
				dialogProperty={dialogProperty}
				cancelRef={cancelRef}
			/>
			<Stack spacing={5} w='100%'>
				<Flex w='100%' justify='space-between' alignItems='center'>
					<Heading as='h1' size='lg'>
						Tab Cleaner
					</Heading>
					<Stack direction='row' spacing={2} align='center'>
						<SettingToggle
							labelId={removeOtherDomainsId}
							isChecked={removeOtherDomainsIsChecked}
							onClickToggle={handleClickSettingToggle(
								'removeOtherDomains',
								removeOtherDomainsSetIsChecked
							)}
						/>
						<SettingToggle
							labelId={removeNewTabId}
							isChecked={removeNewTabIsChecked}
							onClickToggle={handleClickSettingToggle(
								'enableAutoRemoveNewTab',
								removeNewTabSetIsChecked
							)}
						/>
						<Button onClick={handleClearTabEvent}>Execute</Button>
					</Stack>
				</Flex>

				<Divider />

				<Flex w='100%' justify='space-between' alignItems='center'>
					<Heading as='h1' size='lg'>
						Target Domains
					</Heading>
					<Stack direction='row' spacing={2} align='center'>
						<FileDownloadButton
							isDisabled={!domains}
							onFileDownload={handleFileDownload}
						/>
						<FileUploadButton onFileUpload={handleFileUpload} />
						{/* TODO: minWidth */}
						<Button onClick={handleClearDomains} size='sm' minWidth='60px'>
							Clear
						</Button>
					</Stack>
				</Flex>
				<DomainInput onDomainSubmit={handleDomainSubmit} />
				<DomainList domains={domains} handleRemoveDomain={handleRemoveDomain} />

				<Divider />

				<Flex w='100%' justify='space-between' alignItems='center'>
					<Heading as='h1' size='lg'>
						Cleaned History
					</Heading>
					<Stack direction='row' spacing={2} align='center'>
						<SelectCleanHistoryLimit
							clearHistoriesLimit={clearHistoriesLimit}
							onSelectChange={handleClearHistoriesLimitChange}
						/>
						{/* TODO: minWidth */}
						<Button onClick={handleClearHistories} size='sm' minWidth='60px'>
							Clear
						</Button>
					</Stack>
				</Flex>
				<ClearHistoryList clearHistories={clearHistories} />
			</Stack>
		</VStack>
	);
}

function App() {
	return (
		<ChakraProvider>
			<Box maxWidth='992px' m='auto' my={3} p={5}>
				<Options />
			</Box>
		</ChakraProvider>
	);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
	const errorMessage = 'Failed to find root element';
	alert(errorMessage);
	throw new Error(errorMessage);
}

// https://github.com/chakra-ui/chakra-ui/discussions/5051
if (!localStorage.getItem('chakra-ui-color-mode-default')) {
	localStorage.setItem('chakra-ui-color-mode', 'dark');
	localStorage.setItem('chakra-ui-color-mode-default', 'set');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
