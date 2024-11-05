import React from 'react';
import Web3 from 'web3';
import { Row, Col, Button, ButtonGroup, Card, Modal} from 'react-bootstrap';
import { Link, useLocation, useNavigate } from "react-router-dom";
import Form from 'react-bootstrap/Form';
import { useState, useEffect } from 'react';
import { routeNames } from "../../routes";
import './index.scss';
import spume from '../../assets/img/spume.png';
import metacraft from '../../assets/img/metacraft.png';
import { useDispatch, useSelector } from "react-redux";
import * as selectors from "store/selectors";
import { updateWalletConnection } from "store/actions";
import { tokenAddresses } from 'config';
import { AbiItem } from 'web3-utils';
import tokenABI from '../../abi/token.abi.json';
import stakingABI from '../../abi/staking.abi.json';
import vestingABI from '../../abi/vesting.abi.json';
import { StakingAddress, VestingAddress } from 'config';
import confirmImage from '../../assets/img/Shape.png';
import transactionLoader from '../../assets/img/loader.gif';
/**
 */

declare let window: any;

const IDOs = () => {
    const [depositedAmount, setDepositedAmount] = useState<any>('0');
    const [earnedRDX, setEarnedRDX] = useState<any>('0');
    const [vestingInfo, setVestingInfo] = useState<any>('0');
    const [claimableRDX, setClaimableRDX] = useState<any>('0');
    const [isModalShow, setModalShow] = useState<boolean>(false);
    const [isableClaim, setAbleClaim] = useState<boolean>(true);
    const [isTransactionConfirm, setIsTransactionConfirm] = useState<boolean>(false);
    const dispatch = useDispatch();
    const WalletState = useSelector(selectors.WalleteState);
    const connectionState = WalletState.wallet_connection;
    const wallet_balance = WalletState.wallet_balance;
    const web3 = new Web3(window.ethereum);

    const StakingContract = new web3.eth.Contract(stakingABI as AbiItem[], StakingAddress);
    const VestingContract = new web3.eth.Contract(vestingABI as AbiItem[], VestingAddress);
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
              wallet_balance : 0,
            })
          );
        } else {
            const rdxAddress = tokenAddresses[0].address;
            const tokenInst = new web3.eth.Contract(tokenABI as AbiItem[], rdxAddress);
            const balanceDec = await tokenInst.methods.balanceOf(accounts[0]).call();
            const balance = await web3.utils.fromWei(balanceDec, "ether");
            const userInfo = await StakingContract.methods.users(accounts[0]).call();
            const depositedAmount_t = web3.utils.fromWei(userInfo[0], "ether");
            setDepositedAmount( depositedAmount_t );
            const earnedRDX_t = await StakingContract.methods.earned(accounts[0]).call();
            const earned_eth = web3.utils.fromWei(earnedRDX_t, "ether");
            setEarnedRDX( earned_eth );

            const vestingUserInfo = await VestingContract.methods.investorsInfo(accounts[0]).call();
            const TotalAmuntofRDX_t = web3.utils.fromWei(vestingUserInfo[2], "ether");
            setVestingInfo( TotalAmuntofRDX_t );

            const withdrawableTokens = await VestingContract.methods.withdrawableTokens(accounts[0]).call();
            const withdrawableT_t = web3.utils.fromWei(withdrawableTokens, "ether");
            setClaimableRDX( withdrawableT_t );

            const currentDate = new Date();
            const timestamp = Math.floor(currentDate.getTime() / 1000);
            const reward_claimed = await StakingContract.methods.rewardClaimed(accounts[0]).call();
            const reward_period = await StakingContract.methods.rewardPeriod().call();
            console.log("timestamp", timestamp);
            console.log("Math.floor(reward_claimed) + Math.floor(reward_period)", Math.floor(reward_claimed) + Math.floor(reward_period));
            setAbleClaim(timestamp >= Math.floor(reward_claimed) + Math.floor(reward_period) ? true : false);
            dispatch(
                updateWalletConnection({
                connection_state: true,
                account_address: accounts[0].toString(),
                wallet_balance : balance,
                })
            );
        }
    }
    const closeModal = () => {
        setModalShow(false);
    };
    const onClaim = async() =>{
        try {
            //here
            setModalShow(true);
            setIsTransactionConfirm(false);
            await StakingContract.methods.claimReward().send({
                from : WalletState.account_address
            });
            const userInfo = await StakingContract.methods.users(WalletState.account_address).call();
            const depositedAmount_t = web3.utils.fromWei(userInfo[0], "ether");
            setDepositedAmount( depositedAmount_t );
            const earnedRDX_t = await StakingContract.methods.earned(WalletState.account_address).call();
            const earned_eth = web3.utils.fromWei(earnedRDX_t, "ether");
            setEarnedRDX( earned_eth );
            setIsTransactionConfirm(true);

            setAbleClaim(false);
        } catch (e) {
            setModalShow(false);
        }
    };
    const onVestingClaim = async() =>{
        try {
            setModalShow(true);
            setIsTransactionConfirm(false);
            await VestingContract.methods.withdrawTokens().send({
                from : WalletState.account_address
            });

            const vestingUserInfo = await VestingContract.methods.investorsInfo(WalletState.account_address).call();
            const TotalAmuntofRDX_t = web3.utils.fromWei(vestingUserInfo[2], "ether");
            setVestingInfo( TotalAmuntofRDX_t );

            const withdrawableTokens = await VestingContract.methods.withdrawableTokens(WalletState.account_address).call();
            const withdrawableT_t = web3.utils.fromWei(withdrawableTokens, "ether");
            setClaimableRDX( withdrawableT_t );

            setIsTransactionConfirm(true);
        } catch (e) {
            setModalShow(false);
        }
    };
    const onStakePage = () => {
        window.location.href = "/";
    };
    return (
        <div className="home-container mb-5" style={{ fontFamily: 'Inter', color: 'white'}}>
            <Row style={{justifyContent:'center', marginTop:"30px"}}>
                <Col xl="6" md="12" sm="12" style={{textAlign : "center"}}>
                    <p className="dashboard-title">Upcoming IDOs</p>
                    <Card className="custom-card">
                        <Row>
                            <Col xl="3" md="6" sm="6" xs="6" style={{padding:"0"}}>
                                <div className="ido-content-header">Project Name</div>
                                <div className='ido-content-body-first'>
                                    <img src={spume} />
                                    Spume IDO
                                </div>
                                <div className='ido-content-body-first'>
                                    <img src={metacraft} />
                                    Metacraft IDO
                                </div>
                            </Col>
                            <Col xl="3" md="6" sm="6" xs="6" style={{padding:"0"}}>
                                <div className="ido-content-header">Date</div>
                                <div className='ido-content-body'>August 6, 2022</div>
                                <div className='ido-content-body'>August 10, 2022</div>
                            </Col>
                            <Col xl="3" md="6" sm="6" xs="6" style={{padding:"0"}}>
                                <div className="ido-content-header">Min/MAX Amount</div>
                                <div className='ido-content-body'>$500/$1,000</div>
                                <div className='ido-content-body'>$500/$1,000</div>
                            </Col>
                            <Col xl="3" md="6" sm="6" xs="6" style={{padding:"0"}}>
                                <div className="ido-content-header">&nbsp;</div>
                                <div className='ido-content-body'>
                                    <Link to={routeNames.idos_spume}><Button className='dashboard-content-button'>Get Allocation</Button></Link>
                                </div>
                                <div className='ido-content-body'>
                                    <Button className='dashboard-content-button' disabled = {true}>Get Allocation</Button>
                                </div>
                            </Col>  
                        </Row>
                    </Card>
                </Col>
            </Row>
          
            <Modal className="modal-form" show={isModalShow} onHide={closeModal} aria-labelledby="contained-modal-title-vcenter" centered>
                <Modal.Body>
                    {
                        !isTransactionConfirm ? (<img className="loadingbar" src={transactionLoader}></img>) : 
                        (<img className="confirmImage" src={confirmImage}></img>)
                    }
                    {
                        !isTransactionConfirm ? (<p className="modal-title">Waiting for Confirmation</p>) : 
                        (<p className="confirm-title">Transaction Submitted</p>)
                    }
                    {
                        !isTransactionConfirm ? (<p className="modal-content">Confirm this transaction in your wallet.</p>) : 
                        (<p className="confirm-content">View on etherscan</p>)
                    }
                </Modal.Body>
                <Modal.Footer className = "modal-footer">
                    {
                        !isTransactionConfirm ? "" : (<Button className="close-button" onClick={closeModal}>Close</Button>)
                    }
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default IDOs;