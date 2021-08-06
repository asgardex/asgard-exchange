export const ETH_BLOCKLIST = ['0x4bf5dc91e2555449293d7824028eb8fe5879b689'];

export const addressIsBlockListed = ({
  address,
  blocklist,
}: {
  address: string;
  blocklist: string[];
}): boolean => {
  return blocklist.includes(address);
};
