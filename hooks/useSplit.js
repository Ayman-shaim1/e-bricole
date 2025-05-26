
export default function useSplit(value, size) {
    return value.length > size ? value.slice(0, size) + "..." : value;
}