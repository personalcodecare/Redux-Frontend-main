import React from 'react';
import Web3 from 'web3';
import { Row, Col, Button, ButtonGroup, Card, Modal} from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import './index.scss';
import { routeNames } from "../../routes";
import cardLogo from '../assets/img/card-logo.png';

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

const Dashboard = () => {
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
    const onCompound = async() => {
        try {
            setModalShow(true);
            setIsTransactionConfirm(false);
            await StakingContract.methods.compound(WalletState.account_address).send({
                from : WalletState.account_address
            });
            const userInfo = await StakingContract.methods.users(WalletState.account_address).call();
            const depositedAmount_t = web3.utils.fromWei(userInfo[0], "ether");
            setDepositedAmount( depositedAmount_t );
            const earnedRDX_t = await StakingContract.methods.earned(WalletState.account_address).call();
            const earned_eth = web3.utils.fromWei(earnedRDX_t, "ether");
            setEarnedRDX( earned_eth );
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
                    <p className="dashboard-title">My Dashboard</p>
                    <Card className="custom-card">
                        <Row>
                            <Col xl="3" md="6" sm="6" xs="6" style={{padding:"0"}}>
                                <div className="daboard-content-header">Deposited</div>
                                <div className='daboard-content-body'>{Math.round(Number(depositedAmount)*100)/100}</div>
                                <div className='button-layout'>
                                    <Link to={routeNames.staking}><Button className='dashboard-content-button' onClick={onStakePage}>Stake More</Button></Link>
                                    
                                </div>
                            </Col>
                            <Col xl="3" md="6" sm="6" xs="6" style={{padding:"0"}}>
                                <div className="daboard-content-header">Earned RDX</div>
                                <div className='daboard-content-body'>{Math.round(Number(earnedRDX)*100)/100}</div>
                                <div className='button-layout'>
                                    <Button className='dashboard-content-button' disabled = {!isableClaim} onClick={() => onClaim()}>Claim</Button>
                                    <Button className='dashboard-content-button-compound' onClick={() => onCompound()}>Compound</Button>
                                </div>
                                {
                                    !isableClaim ? (
                                    <div className='dashboard-error'>
                                        you must wait 7 days to claim your rewards.
                                    </div>) : (<div></div>)
                                }
                                
                            </Col>
                            <Col xl="3" md="6" sm="6" xs="6" style={{padding:"0"}}>
                                <div className="daboard-content-header">APY</div>
                                <div className='daboard-content-body'>24%</div>
                            </Col>
                            <Col xl="3" md="6" sm="6" xs="6" style={{padding:"0"}}>
                                <div className="daboard-content-header">TVL</div>
                                <div className='daboard-content-body'>$300K</div>
                            </Col>  
                        </Row>
                    </Card>
                    <p className="dashboard-content" style={{fontSize:'18px'}}>Your RDX tokens will be locked for 45 days. After this period, you’re free to withdraw at any time. Stake a minimum of 500 RDX for 45 days to participate. Every additional 500 RDX gets you an additional lottery ticket increasing your probability of being whitelisted in one of our IDOs. It is important to note, that when you add more $RDX tokens to your stake, the 45 day lockup starts again on all tokens.</p>
                </Col>
            </Row>
            <Row style={{justifyContent:'center', marginTop:"30px"}}>
                <Col xl="6" md="12" sm="12" style={{textAlign : "center"}}>
                    <p className="dashboard-title">Vesting</p>
                    <Card className="custom-card" style={{ marginTop:"20px"}}>
                        <Row>
                            <Col xl="6" md="6" sm="6" xs="6" style={{padding:"0"}}>
                                <div className="daboard-content-header">Total Amount of $RDX</div>
                                <div className='daboard-content-body'>{Math.round(Number(vestingInfo)*100)/100}</div>
                            </Col>
                            <Col xl="6" md="6" sm="6" xs="6" style={{padding:"0"}}>
                                <div className="daboard-content-header">Total $RDX Claimable</div>
                                <div className='daboard-content-body'>{Math.round(Number(claimableRDX)*100)/100}</div>
                                <div className='button-layout'>
                                    <Button className='dashboard-content-button' onClick={onVestingClaim}>Claim</Button>
                                </div>
                            </Col>
                        </Row>
                    </Card>
                    <p className="dashboard-content" style={{fontSize:'18px'}}>
                        For all airdropped users: Starting on September 19th, you will be able to claim the remaining 50% of your $RDX tokens at a rate of 10% per month for 5 months.
                    </p>
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

export default Dashboard;