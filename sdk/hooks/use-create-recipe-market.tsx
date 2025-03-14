import type { MarketActions } from "@/sdk/market";
import { useActionsEncoder } from "@/sdk/hooks";
import { NULL_ADDRESS, REWARD_STYLE } from "@/sdk/constants";
import { ContractMap } from "@/sdk/contracts";

export const useCreateRecipeMarket = ({
  chainId = 0,
  enterMarketActions,
  exitMarketActions,
  lockupTime,
  inputToken = NULL_ADDRESS as string,
  frontendFee,
  rewardStyle,
}: {
  chainId: number;
  inputToken: string;
  lockupTime: string;
  frontendFee: string;
  enterMarketActions:
    | MarketActions
    | {
        commands: string[];
        state: string;
      };
  exitMarketActions:
    | MarketActions
    | {
        commands: string[];
        state: string;
      };
  rewardStyle: REWARD_STYLE;
}) => {
  // Check is market is ready to be created
  let isReady = false;

  // Options to pass to writeContract()
  let writeContractOptions = null;

  // Get smart contract
  const recipeContract =
    ContractMap[chainId as keyof typeof ContractMap]?.RecipeMarketHub ??
    undefined;

  // Encoded commands and states for market
  let enterMarket;
  if (
    typeof enterMarketActions === "object" &&
    "commands" in enterMarketActions
  ) {
    enterMarket = { data: enterMarketActions };
  } else {
    enterMarket = useActionsEncoder({ marketActions: enterMarketActions });
  }

  let exitMarket;
  if (
    typeof exitMarketActions === "object" &&
    "commands" in exitMarketActions
  ) {
    exitMarket = { data: exitMarketActions };
  } else {
    exitMarket = useActionsEncoder({ marketActions: exitMarketActions });
  }

  // If all data is ready, set isReady to true and set writeContractOptions
  if (recipeContract && enterMarket.data && exitMarket.data) {
    isReady = true;

    /**
     * @TODO Strictly type this
     */
    // @ts-ignore
    writeContractOptions = {
      address: recipeContract.address,
      abi: recipeContract.abi,
      functionName: "createMarket",
      args: [
        inputToken,
        lockupTime,
        frontendFee, // 1e18 = 100%
        {
          weirollCommands: enterMarket.data.commands,
          weirollState: enterMarket.data.state,
        },
        {
          weirollCommands: exitMarket.data.commands,
          weirollState: exitMarket.data.state,
        },
        rewardStyle, // 0 = Upfront, 1 = Arrear, 2 = Forfeitable
      ],
    };
  }

  return {
    isReady,
    writeContractOptions,
  };
};
