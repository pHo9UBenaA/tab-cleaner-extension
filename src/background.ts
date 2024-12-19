import { ContextMenuIds } from './constants/context-menu';
import { handleClearTabEvent } from './handles/clear-tab';
import { handleRegisterDomainEvent } from './handles/register-domain';

const handleMapper = {
	[ContextMenuIds.clearTab]: handleClearTabEvent,
	[ContextMenuIds.registerDomain]: handleRegisterDomainEvent,
} as const satisfies { [key in ContextMenuIds]: () => void };

const initContextMenus = () => {
	const removeAllContextMenus = () => {
		chrome.contextMenus.removeAll();
	};

	const createContextMenu = (id: string, message: string) => {
		chrome.contextMenus.create({
			id,
			title: chrome.i18n.getMessage(message),
			contexts: ['all'],
		});
	};

	const createContextMenus = () => {
		createContextMenu(ContextMenuIds.clearTab, 'clearTabTitle');
		createContextMenu(ContextMenuIds.registerDomain, 'registerCurrentPageDomain');
	};

	removeAllContextMenus();
	createContextMenus();
};

const contextMenusAddListener = () => {
	chrome.contextMenus.onClicked.addListener((info, tab) => {
		const menuItemId = info.menuItemId.toString();
		if (menuItemId in handleMapper) {
			handleMapper[menuItemId as ContextMenuIds]();
		}
	});
};

chrome.runtime.onInstalled.addListener(() => {
	initContextMenus();
	contextMenusAddListener();
});

chrome.action.onClicked.addListener(() => {
	chrome.runtime.openOptionsPage();
});

chrome.commands.onCommand.addListener((command) => {
	if (command in handleMapper) {
		handleMapper[command as ContextMenuIds]();
	}
});
