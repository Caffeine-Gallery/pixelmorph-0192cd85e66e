export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'getAvatarHistory' : IDL.Func([], [IDL.Vec(IDL.Vec(IDL.Nat8))], ['query']),
    'storeAvatar' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [IDL.Opt(IDL.Vec(IDL.Nat8))],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
