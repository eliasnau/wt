import { debounce } from "lodash";
import { useEffect, useMemo, useRef } from "react";

export function useDebounce<T extends (...args: any[]) => any>(
	callback: T,
	delay = 300,
) {
	const ref = useRef(callback);

	useEffect(() => {
		ref.current = callback;
	}, [callback]);

	const debouncedCallback = useMemo(() => {
		const func = (...args: Parameters<T>) => {
			ref.current(...args);
		};

		return debounce(func, delay);
	}, [delay]);

	return debouncedCallback;
}
