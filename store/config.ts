import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { validateEditCode } from '../src/api/validActions';
interface CodeConfig {
    editCode: string;
}
interface GeneralConfig {
    // 是否简易模式
    // isSimpleMode: boolean;
}
interface Config {
    codeConfig: CodeConfig;
    generalConfig: GeneralConfig;
}
interface SettingStore {
    config: Config;
    // 重置通用配置
    resetGeneralConfig: () => void;
    resetCodeConfig: () => void;
    resetAllConfig: () => void;
    setConfig: (callback: (config: Config) => void) => void;
    setEditCodePermission: (editCode: string) => Promise<boolean>;
    hasEditCodePermission: boolean;
    validateEditCode: () => Promise<boolean>;
}

const defaultConfig: Config = {
    codeConfig: {
        editCode: '',
    },
    generalConfig: {
        // isSimpleMode: false,
    }
};

const useConfigStore = create<SettingStore>()(
    devtools(
        persist(immer<SettingStore>(
            (set, get) => ({
                config: defaultConfig,
                hasEditCodePermission: process.env.EDIT_CODE === undefined,
                resetCodeConfig: () => {
                    set((state) => {
                        state.config.codeConfig = { ...defaultConfig.codeConfig }
                    })
                },
                resetAllConfig: () => {
                    set((state) => {
                        state.config = { ...defaultConfig }
                    })
                },
                resetGeneralConfig: () => {
                    set((state) => {
                        state.config.generalConfig = { ...defaultConfig.generalConfig }
                    })
                },
                setConfig: (callback) => {
                    set(state => {
                        callback(state.config)
                    })
                },
                setEditCodePermission: async (code) => {
                    const hasEditCodePermission = await validateEditCode(code)
                    if (hasEditCodePermission) {
                        set((state) => {
                            state.config.codeConfig.editCode = code
                            state.hasEditCodePermission = true
                        })
                    }
                    return hasEditCodePermission
                },
                validateEditCode: async () => {
                    const editCode = get().config.codeConfig.editCode;
                    return validateEditCode(editCode);
                }
            })),
            {
                name: 'configStore',
                storage: createJSONStorage(() => localStorage),
                partialize: state => {
                    return { config: state.config }
                }
            },
        ),
        {
            name: 'configStore',
        }
    ),
)

export default useConfigStore;
