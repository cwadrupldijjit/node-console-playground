export function sleep(ms: number, abortSignal?: AbortSignal) {
    return new Promise<void>((resolve) => {
        abortSignal?.addEventListener('abort', handleAbort);
        abortSignal
        const timeoutHandle = setTimeout(
            () => {
                abortSignal?.removeEventListener('abort', handleAbort);
                resolve();
            },
            ms,
        );
        
        function handleAbort() {
            clearTimeout(timeoutHandle);
            resolve();
        }
    });
}
