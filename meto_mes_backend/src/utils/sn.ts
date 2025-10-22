export enum SnType {
    BEAM = 'beam',
    SHELL = 'shell'
};

export function isS316Shell(sn: string) {
  if (typeof sn !== "string") return false
  return sn.length > 11 
  || sn.toUpperCase().startsWith("S316")
  || sn.toUpperCase().startsWith("316")
};
