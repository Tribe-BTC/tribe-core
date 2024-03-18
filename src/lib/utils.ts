function toXOnly(key: any) {
  return key.length === 33 ? key.slice(1, 33) : key;
}

export { toXOnly };
