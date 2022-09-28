import {
    FC,
    MutableRefObject,
    PropsWithChildren,
    ReactElement,
    startTransition,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

const Locale: FC<PropsWithChildren<{ lang: string }>> = ({ children }) => (
    <>{children}</>
);

const useLocalStorage = () => {
    const localStorage = typeof globalThis.localStorage === "object" ? globalThis.localStorage : undefined;
    return {
        get(key: string): string | null {
            return localStorage?.getItem(key);
        },
        set(key: string, value: string | null) {
            localStorage?.setItem(key, value);
        },
    };
}

const useForm = (): [
    MutableRefObject<HTMLFormElement>,
    Record<string, unknown>,
] => {
    const formRef = useRef<HTMLFormElement>();
    const [values, setValues] = useState<Record<string, unknown>>({});
    const [initialized, setInitialized] = useState<Record<string, boolean>>({});
    const localStorage = useLocalStorage();

    useEffect(() => {
        const form = formRef.current;
        if (form) {
            const unsubs: (() => void)[] = [];
            for (let index = 0; index < form.elements.length; index += 1) {
                const element = form.elements.item(index);
                if (element instanceof HTMLInputElement) {
                    const keyStore = element.name;
                    const storedValue = localStorage.get(keyStore);
                    if (storedValue) {
                        element.value = storedValue;
                    }
                    const inputChange = (event: Event) => {
                        const target = event.target;
                        if (target instanceof HTMLInputElement) {
                            localStorage.set(keyStore, target.value);
                        }
                    }
                    element.addEventListener("change", inputChange);
                    unsubs.push(() => element.removeEventListener("change", inputChange));
                }
            }

            const initialFormData = new FormData(form);
            setValues((v) => ({
                ...v,
                ...Object.fromEntries(Array.from(initialFormData.entries())),
            }));
            const change = (event: Event) => {
                const target = event.target;
                if (target instanceof HTMLInputElement && target.name) {
                    setValues((v) => ({ ...v, [target.name]: target.value }));
                }
            };
            form.addEventListener("change", change);
            unsubs.push(() => form.removeEventListener("change", change));
            return () => {
                unsubs.forEach(f => f());
            };
        }
    }, [formRef.current]);

    return [formRef, values];
};

export const Page: FC = () => {
    const [form, values] = useForm();

    const totalGram = useMemo(() => {
        const ratioCoffeeGram = Number(values["coffee-gram"]);
        const ratioWaterMl = Number(values["water-ml"]);
        const usageWaterMl = Number(values["use-water-ml"]);
        return usageWaterMl * (ratioCoffeeGram / ratioWaterMl);
    }, [values]);

    return (
        <>
            <form ref={form}>
                <div className="hero min-h-screen bg-base-200">
                    <div className="hero-content flex-col">
                        <div>
                            <header>
                                <h1 className="text-5xl font-bold">
                                    <Locale lang="es-CL">☕️ Calculadora de Ratio</Locale>
                                </h1>
                            </header>

                            <div>
                                <section>
                                    <p>
                                        <Locale lang="es-CL">
                                            Para un ration de{" "}
                                            <input
                                                name="coffee-gram"
                                                defaultValue={1}
                                                type="text"
                                                className="input input-bordered"
                                            />{" "}
                                            gramos de café por{" "}
                                            <input
                                                name="water-ml"
                                                defaultValue={12}
                                                type="text"
                                                className="input input-bordered"
                                            />{" "}
                                            mililitros de agua.
                                        </Locale>
                                    </p>
                                    <p>
                                        <Locale lang="es-CL">
                                            En tu porción usaras{" "}
                                            <input
                                                name="use-water-ml"
                                                defaultValue={200}
                                                type="text"
                                                className="input input-bordered"
                                            />{" "}
                                            mililitros de agua.
                                        </Locale>
                                    </p>
                                    <div className="divider"></div>
                                    <p>
                                        <Locale lang="es-CL">
                                            Debes usar{" "}
                                            <strong>
                                                {totalGram.toLocaleString(undefined, {
                                                    maximumFractionDigits: 2,
                                                })}
                                            </strong>{" "}
                                            gramos de café.
                                        </Locale>
                                    </p>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
};

export default Page;
