import React, { useEffect, useState } from "react";
import {
  Navbar as BsNavbar,
  NavItem,
  Nav,
  NavDropdown,
  Modal as BsModal,
  Row,
  Col,
} from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { routeNames } from "routes";
import logo from "../../../assets/img/redux-light.svg";
import metamaskLogo from "../../../assets/img/metamask.png";
import "./index.scss";
import Web3 from "web3";
import close from "../../../assets/img/close.png";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from "store/selectors";
import { updateWalletConnection } from "store/actions";
import { tokenAddresses } from 'config';
import { AbiItem } from 'web3-utils';
import tokenABI from '../../../abi/token.abi.json';

declare let window: any;

const Topbar = () => {
  const dispatch = useDispatch();
  const WalletState = useSelector(selectors.WalleteState);

  const connectionState = WalletState.wallet_connection;
  const account = WalletState.account_address;
  const wallet_balance = WalletState.wallet_balance;
  const web3 = new Web3(window.ethereum);
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const onhandleConnectWalletButton = () => {
    if (connectionState) return;
    loadWeb3();
    
    setOpen(false);
  };

  const onhandleBuyRDXButton = () => {
    setOpen(false);
    alert("buy RDX!");
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountChanged);
      checkConnection();
    }
  }, []);

  function checkConnection() {
    window.ethereum
      .request({ method: "eth_accounts" })
      .then(handleAccountChanged)
      .catch(console.error);
  }

  async function handleAccountChanged(accounts) {
    if (accounts.length === 0) {
      console.log("metamask locked");
      dispatch(
        updateWalletConnection({
          connection_state: false,
          account_address: "",
          wallet_balance: 0,
        })
      );
    } else {
      const rdxAddress = tokenAddresses[0].address;
      const tokenInst = new web3.eth.Contract(tokenABI as AbiItem[], rdxAddress);
      const balanceDec = await tokenInst.methods.balanceOf(accounts[0]).call();
      const balance = await web3.utils.fromWei(balanceDec, "ether");
      dispatch(
        updateWalletConnection({
          connection_state: true,
          account_address: accounts[0].toString(),
          wallet_balance: balance,
        })
      );
    }
  }

  const loadWeb3 = async () => {
    try {
      if (window.ethereum?.isMetaMask) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const account = Web3.utils.toChecksumAddress(accounts[0]).toString();
        const rdxAddress = tokenAddresses[0].address;
        const tokenInst = new web3.eth.Contract(tokenABI as AbiItem[], rdxAddress);
        const balanceDec = await tokenInst.methods.balanceOf(accounts[0]).call();
        const balance = await web3.utils.fromWei(balanceDec, "ether");
        dispatch(
          updateWalletConnection({
            connection_state: true,
            account_address: account,
            wallet_balance: balance,
          })
        );
      } else {
        console.log("should install metamask");
      }
    } catch (error) {
      dispatch(
        updateWalletConnection({
          connection_state: false,
          account_address: "",
          wallet_balance: 0,
        })
      );
    }
  };

  return (
    <div>
      <div className="Topbar">
        <p>
          Always make sure the URL is app.reduxprotocol.io - bookmark it to be safe.
        </p>
      </div>
      <BsNavbar className="px-5 py-3 navbar-dark" expand="lg" collapseOnSelect>
        <div className="container-fluid">
          <Link
            className="d-flex align-items-center navbar-brand mr-0 c-logo-container"
            to={routeNames.staking}
          >
            <img src={logo} />
          </Link>
          <div className="wallet">
            <Link
              to={"#"}
              className="custom-navbar-button auth-button"
              onClick={onhandleConnectWalletButton}
              style={{ fontSize: "15px" }}
            >
              {connectionState ? (
                <>
                  <img src={metamaskLogo} style={{ width: "25px" }} />
                  <span style={{ fontSize: "13px" }}>
                    &nbsp;
                    {account.slice(0, 6) +
                      "..." +
                      account.slice(account.length - 4, account.length)}{" "}
                  </span>
                </>
              ) : (
                "Connect Wallet"
              )}
            </Link>
          </div>
          <BsNavbar.Toggle
            aria-controls="responsive-navbar-nav"
            style={{
              background: "transparent",
              borderColor: "transparent"
            }}
            onClick={handleOpen}
          />
          <BsNavbar.Collapse
          id="resposive-navbar-nav"
            style={{display:open?"block":"none"}}
            className={open?"nav-menu-wrap show":"nav-menu-wrap"}
            
          >
            <Nav className="ml-auto item-center">
              <div className="closetoggle">
                <img src={close} onClick={handleClose} />
              </div>
              <Link
                to={routeNames.staking}
                className="custom-navbar-button mt custom-navbar-normal-button"
                onClick={handleClose}
              >
                Staking
              </Link>
              <Link
                to={routeNames.dashboard}
                className="custom-navbar-button custom-navbar-normal-button"
                onClick={handleClose}
              >
                Dashboard
              </Link>
              <Link
                to={routeNames.idos}
                className="custom-navbar-button custom-navbar-normal-button"
                onClick={handleClose}
              >
                IDOs
              </Link>
              <Link
                to={"#"}
                className="custom-navbar-button auth-button pw"
                onClick={onhandleConnectWalletButton}
              >
                {connectionState ? (
                  <>
                    <img src={metamaskLogo} style={{ width: "25px" }} />
                    <span style={{ fontSize: "15px" }}>
                      &nbsp;
                      {account.slice(0, 6) +
                        "..." +
                        account.slice(account.length - 4, account.length)}{" "}
                    </span>
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </Link>
              <a
                href= "https://app.uniswap.org/#/swap?chain=mainnet&inputCurrency=0xdac17f958d2ee523a2206206994597c13d831ec7&outputCurrency=0xd8C4ef2D99c9F962180008418a5665Fcc4b99ecD"
                className="custom-navbar-button buy-rdx-button pw"
                target="_blank"
                rel = "noreferrer"
              >
                Buy $RDX
              </a>
            </Nav>
          </BsNavbar.Collapse>
        </div>
      </BsNavbar>
    </div>
  );
};

export default Topbar;
