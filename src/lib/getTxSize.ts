export const getTxSize = (
  inputsLengh: number,
  outputsLenght: number,
  tempMultisigLenght: number,
) => {
  var size_of_each_input = 0;
  var i;
  for (i = 0; i < tempMultisigLenght; i++) {
    size_of_each_input = size_of_each_input + (64 + 32 + 8);
  }
  var txsize = 0;
  var i;
  for (i = 0; i < inputsLengh; i++) {
    txsize = txsize + size_of_each_input;
  }
  var i;
  for (i = 0; i < outputsLenght; i++) {
    txsize = txsize + 30;
  }
  return txsize;
};
